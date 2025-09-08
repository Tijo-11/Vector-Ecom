from .common import *
import razorpay
from decouple import config
import requests
import logging
from django.db import transaction

# Set up logging
logger = logging.getLogger(__name__)




class RazorpayCheckoutView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = [AllowAny]
    queryset = CartOrder.objects.all()

    def create(self, request, *args, **kwargs):
        order_id = self.kwargs['order_id']
        try:
            order = CartOrder.objects.get(oid=order_id)
            if order.payment_status == "paid":
                return Response({'message': 'Already paid', 'icon': 'warn'}, status=status.HTTP_200_OK)
        except CartOrder.DoesNotExist:
            return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        key_id = config('RAZORPAY_KEY_ID')
        key_secret = config('RAZORPAY_KEY_SECRET')
        if not key_id or not key_secret:
            return Response(
                {'message': 'Razorpay API credentials are missing or invalid'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            client.set_app_details({"title": config('APP_TITLE', 'Django'), "version": config('APP_VERSION', '4.2')})
            razorpay_order = client.order.create({
                'amount': int(order.total * 100),  # In paise
                'currency': 'INR',
                'payment_capture': 1,
                'notes': {'store_name': config('STORE_NAME', 'RetroRelics')}
            })
            order.stripe_session_id = razorpay_order['id']
            order.save()
            return Response({
                'id': razorpay_order['id'],
                'amount': razorpay_order['amount'],
                'currency': razorpay_order['currency'],
                'key': key_id,
                'order_id': order_id,
                'name': order.full_name,
                'email': order.email,
                'contact': order.mobile
            }, status=status.HTTP_200_OK)
        except razorpay.errors.BadRequestError as e:
            error_message = str(e)
            if 'authentication failed' in error_message.lower():
                return Response(
                    {'message': 'Razorpay authentication failed. Please check API credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return Response(
                {'message': f'Error creating Razorpay order: {error_message}'},
                status=status.HTTP_400_BAD_REQUEST
            )

import time
import threading

logger = logging.getLogger(__name__)

def send_notification(user=None, vendor=None, order=None, order_item=None):
    """Create a notification and log any failures."""
    try:
        Notification.objects.create(user=user, vendor=vendor, order=order, order_item=order_item)
        logger.info(f"Notification created for order {order.id if order else 'unknown'}")
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")
        print(f"Failed to create notification: {str(e)}")

def send_email(subject, text_body, html_body, from_email, to_email):
    """Send an email and log failures."""
    try:
        msg = EmailMultiAlternatives(subject, text_body, from_email, [to_email])
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        logger.info(f"Email sent to {to_email}")
        print(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        print(f"Failed to send email to {to_email}: {str(e)}")

def get_paypal_access_token(client_id, secret_id):
    """Fetch PayPal access token."""
    token_url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"
    headers = {"Accept": "application/json", "Accept-Language": "en_US"}
    data = {"grant_type": "client_credentials"}
    try:
        response = requests.post(token_url, headers=headers, data=data, auth=(client_id, secret_id))
        response.raise_for_status()
        return response.json().get("access_token")
    except Exception as e:
        logger.error(f"PayPal auth failed: {str(e)}")
        print(f"PayPal auth failed: {str(e)}")
        raise

class PaymentSuccessView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    queryset = CartOrder.objects.all()
    permission_classes = [AllowAny]

    def send_all_notifications(self, order, order_items):
        """Send notifications and emails in a separate thread."""
        def send_notifications_thread():
            """Run notification and email sending in a background thread."""
            # Notify buyer once
            if order.buyer and order.email:
                try:
                    # Basic email validation
                    if "@" in order.email and "." in order.email:
                        send_notification(user=order.buyer, order=order)
                        merge_data = {'order': order, 'order_items': order_items}
                        subject = "Order Placed Successfully"
                        text_body = render_to_string("email/customer_order_confirmation.txt", merge_data)
                        html_body = render_to_string("email/customer_order_confirmation.html", merge_data)
                        send_email(subject, text_body, html_body, settings.DEFAULT_FROM_EMAIL, order.email)
                    else:
                        logger.error(f"Invalid buyer email format: {order.email}")
                        print(f"Invalid buyer email format: {order.email}")
                except Exception as e:
                    logger.error(f"Failed to process buyer notifications: {str(e)}")
                    print(f"Failed to process buyer notifications: {str(e)}")

            # Group order items by vendor to send one email per vendor
            vendor_items = {}
            for order_item in order_items:
                if order_item.vendor and order_item.vendor.email:
                    try:
                        # Validate email format
                        if "@" in order_item.vendor.email and "." in order_item.vendor.email:
                            vendor_id = order_item.vendor.id
                            if vendor_id not in vendor_items:
                                vendor_items[vendor_id] = {
                                    'email': order_item.vendor.email,
                                    'items': []
                                }
                            vendor_items[vendor_id]['items'].append(order_item)
                        else:
                            logger.error(f"Invalid vendor email format: {order_item.vendor.email}")
                            print(f"Invalid vendor email format: {order_item.vendor.email}")
                    except Exception as e:
                        logger.error(f"Error processing vendor {order_item.vendor.id}: {str(e)}")
                        print(f"Error processing vendor {order_item.vendor.id}: {str(e)}")

            # Notify vendors
            for vendor_id, data in vendor_items.items():
                try:
                    # Send notifications for each order item
                    for order_item in data['items']:
                        send_notification(vendor=order_item.vendor, order=order, order_item=order_item)
                    # Send a single email per vendor
                    merge_data = {'order': order, 'order_items': data['items']}
                    subject = "New Sale!"
                    text_body = render_to_string("email/vendor_order_sale.txt", merge_data)
                    html_body = render_to_string("email/vendor_order_sale.html", merge_data)
                    send_email(subject, text_body, html_body, settings.DEFAULT_FROM_EMAIL, data['email'])
                except Exception as e:
                    logger.error(f"Failed to process vendor notifications for {data['email']}: {str(e)}")
                    print(f"Failed to process vendor notifications for {data['email']}: {str(e)}")

        # Start a new thread for notifications and emails
        thread = threading.Thread(target=send_notifications_thread)
        thread.start()

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        payload = request.data
        order_id = payload.get("order_id")
        session_id = payload.get("session_id")  # Razorpay
        capture_id = payload.get("paypal_capture_id")  # PayPal capture ID

        logger.debug(f"Received payload: order_id={order_id}, session_id={session_id}, capture_id={capture_id}")
        print(f"Received payload: order_id={order_id}, session_id={session_id}, capture_id={capture_id}")

        if not order_id:
            logger.error("Missing order_id in payload")
            print("Missing order_id in payload")
            return Response({"message": "Missing order_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = CartOrder.objects.get(oid=order_id)
        except CartOrder.DoesNotExist:
            logger.error(f"Order not found: {order_id}")
            print(f"Order not found: {order_id}")
            return Response({"message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == "paid":
            logger.info(f"Order already paid: {order_id}")
            print(f"Order already paid: {order_id}")
            return Response({"message": "already_paid"}, status=status.HTTP_200_OK)

        order_items = CartOrderItem.objects.filter(order=order)

        # PayPal Flow
        if capture_id:
            try:
                access_token = get_paypal_access_token(
                    config("PAYPAL_CLIENT_ID"), config("PAYPAL_CLIENT_SECRET")
                )
                paypal_api_url = f"https://api-m.sandbox.paypal.com/v2/payments/captures/{capture_id}"
                headers = {"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"}
                response = requests.get(paypal_api_url, headers=headers)
                logger.debug(f"PayPal API response: {response.status_code}")
                print(f"PayPal API response: {response.status_code}")

                if response.status_code == 200:
                    paypal_order_data = response.json()
                    paypal_payment_status = paypal_order_data.get("status")

                    if paypal_payment_status == "COMPLETED":
                        with transaction.atomic():
                            if order.payment_status in ["initiated", "processing", "pending"]:
                                order.payment_status = "paid"
                                order.save()
                                # Start notification/email thread without blocking
                                self.send_all_notifications(order, order_items)
                                logger.info(f"PayPal payment successful for order: {order_id}")
                                print(f"PayPal payment successful for order: {order_id}")
                                logger.debug(f"Request processing time: {time.time() - start_time:.2f} seconds")
                                return Response({"message": "payment_successful"}, status=status.HTTP_200_OK)
                        return Response({"message": "Already Paid"}, status=status.HTTP_200_OK)
                    elif paypal_payment_status in ["PENDING", "IN_PROGRESS"]:
                        with transaction.atomic():
                            order.payment_status = "processing"
                            order.save()
                            self.send_all_notifications(order, order_items)
                        logger.info(f"PayPal payment {paypal_payment_status.lower()} for order: {order_id}")
                        print(f"PayPal payment {paypal_payment_status.lower()} for order: {order_id}")
                        return Response(
                            {"message": f"Payment is {paypal_payment_status.lower()}"},
                            status=status.HTTP_202_ACCEPTED
                        )
                    else:
                        logger.error(f"PayPal payment failed with status: {paypal_payment_status}")
                        print(f"PayPal payment failed with status: {paypal_payment_status}")
                        return Response(
                            {"message": f"Payment failed with status: {paypal_payment_status}"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    logger.error(f"PayPal API error: {response.status_code} {response.text}")
                    print(f"PayPal API error: {response.status_code} {response.text}")
                    return Response({"message": "PayPal API error"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"PayPal processing error: {str(e)}")
                print(f"PayPal processing error: {str(e)}")
                return Response({"message": "PayPal processing error"}, status=status.HTTP_400_BAD_REQUEST)

        # Razorpay Flow
        if session_id:
            key_id = config("RAZORPAY_KEY_ID")
            key_secret = config("RAZORPAY_KEY_SECRET")
            if not key_id or not key_secret:
                logger.error("Razorpay API credentials missing")
                print("Razorpay API credentials missing")
                return Response(
                    {"message": "Razorpay API credentials are missing or invalid"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                client.set_app_details({"title": config('APP_TITLE', 'Django'), "version": config('APP_VERSION', '4.2')})
                payment = client.payment.fetch(session_id)
                logger.debug(f"Razorpay payment fetch response: {payment}")
                print(f"Razorpay payment fetch response: {payment}")

                if payment["status"] == "captured":
                    with transaction.atomic():
                        if order.payment_status in ["initiated", "pending", "processing"]:
                            order.payment_status = "paid"
                            order.stripe_session_id = session_id
                            order.save()
                            # Start notification/email thread without blocking
                            self.send_all_notifications(order, order_items)
                            logger.info(f"Razorpay payment successful for order: {order_id}")
                            print(f"Razorpay payment successful for order: {order_id}")
                            logger.debug(f"Request processing time: {time.time() - start_time:.2f} seconds")
                            return Response({"message": "payment_successful"}, status=status.HTTP_200_OK)
                    return Response({"message": "Already Paid"}, status=status.HTTP_200_OK)
                elif payment["status"] in ["failed", "cancelled"]:
                    logger.error(f"Razorpay payment failed with status: {payment['status']}")
                    print(f"Razorpay payment failed with status: {payment['status']}")
                    return Response({"message": "cancelled"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    logger.error(f"Razorpay unexpected payment status: {payment['status']}")
                    print(f"Razorpay unexpected payment status: {payment['status']}")
                    return Response(
                        {"message": f"Payment status: {payment['status']}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except razorpay.errors.BadRequestError as e:
                logger.error(f"Razorpay error: {str(e)}")
                print(f"Razorpay error: {str(e)}")
                return Response({"message": f"Razorpay error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Unexpected Razorpay error: {str(e)}")
                print(f"Unexpected Razorpay error: {str(e)}")
                return Response({"message": "Razorpay processing error"}, status=status.HTTP_400_BAD_REQUEST)

        logger.error("Missing session_id or paypal_capture_id")
        print("Missing session_id or paypal_capture_id")
        return Response(
            {"message": "Missing session_id or paypal_capture_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
        
#git commit -m " EMail not being sent to other email ids, may be google blocked that as I have sent email to unknown email id, needs to check"