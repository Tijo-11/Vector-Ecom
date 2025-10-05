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
            order.razorpay_session_id = razorpay_order['id']
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

import time
import threading
import logging
import requests
import razorpay
from decouple import config
from django.db import transaction
from rest_framework import generics, status
from rest_framework.response import Response

logger = logging.getLogger(__name__)

class PaymentSuccessView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    queryset = CartOrder.objects.all()
    permission_classes = [AllowAny]

    def send_all_notifications(self, order, order_items):
        """Send notifications and emails asynchronously."""
        def send_notifications_thread():
            # Buyer notification
            if order.buyer and order.email:
                try:
                    if "@" in order.email and "." in order.email:
                        send_notification(user=order.buyer, order=order)
                        merge_data = {'order': order, 'order_items': order_items}
                        subject = "Order Placed Successfully"
                        text_body = render_to_string("email/customer_order_confirmation.txt", merge_data)
                        html_body = render_to_string("email/customer_order_confirmation.html", merge_data)
                        send_email(subject, text_body, html_body, settings.DEFAULT_FROM_EMAIL, order.email)
                except Exception as e:
                    logger.error(f"Buyer notification failed: {str(e)}")

            # Vendor notifications
            vendor_groups = {}
            for item in order_items:
                if item.vendor and item.vendor.email and "@" in item.vendor.email:
                    vendor_groups.setdefault(item.vendor.id, []).append(item)

            for vendor_id, items in vendor_groups.items():
                vendor_email = items[0].vendor.email
                for item in items:
                    send_notification(vendor=item.vendor, order=order, order_item=item)
                merge_data = {'order': order, 'order_items': items}
                subject = "New Sale!"
                text_body = render_to_string("email/vendor_order_sale.txt", merge_data)
                html_body = render_to_string("email/vendor_order_sale.html", merge_data)
                send_email(subject, text_body, html_body, settings.DEFAULT_FROM_EMAIL, vendor_email)

        threading.Thread(target=send_notifications_thread).start()

    def deduct_stock(self, order_items):
        """Decrease product stock after successful payment."""
        for item in order_items:
            product = item.product
            if product.stock_qty >= item.qty:
                product.stock_qty -= item.qty
                product.save()
                logger.info(f"Stock updated: {product.title} -{item.qty}")
            else:
                logger.warning(f"Insufficient stock for {product.title} during payment success.")

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        payload = request.data
        order_id = payload.get("order_id")
        session_id = payload.get("session_id")  # Razorpay
        capture_id = payload.get("paypal_capture_id")  # PayPal

        if not order_id:
            return Response({"message": "Missing order_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = CartOrder.objects.get(oid=order_id)
        except CartOrder.DoesNotExist:
            return Response({"message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == "paid":
            return Response({"message": "already_paid"}, status=status.HTTP_200_OK)

        order_items = CartOrderItem.objects.filter(order=order)

        # --- PayPal flow ---
        if capture_id:
            try:
                access_token = get_paypal_access_token(
                    config("PAYPAL_CLIENT_ID"), config("PAYPAL_CLIENT_SECRET")
                )
                paypal_api_url = f"https://api-m.sandbox.paypal.com/v2/payments/captures/{capture_id}"
                headers = {"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"}
                response = requests.get(paypal_api_url, headers=headers)

                if response.status_code == 200:
                    paypal_data = response.json()
                    if paypal_data.get("status") == "COMPLETED":
                        with transaction.atomic():
                            order.payment_status = "paid"
                            order.save()
                            self.deduct_stock(order_items)
                        self.send_all_notifications(order, order_items)
                        return Response({"message": "payment_successful"}, status=status.HTTP_200_OK)
                    elif paypal_data.get("status") in ["PENDING", "IN_PROGRESS"]:
                        with transaction.atomic():
                            order.payment_status = "processing"
                            order.save()
                        return Response({"message": f"Payment is {paypal_data.get('status').lower()}"}, status=status.HTTP_202_ACCEPTED)
                    else:
                        return Response({"message": f"Payment failed: {paypal_data.get('status')}"}, status=status.HTTP_400_BAD_REQUEST)
                return Response({"message": "PayPal API error"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"PayPal processing error: {str(e)}")
                return Response({"message": "PayPal processing error"}, status=status.HTTP_400_BAD_REQUEST)

        # --- Razorpay flow ---
        if session_id:
            try:
                client = razorpay.Client(auth=(config("RAZORPAY_KEY_ID"), config("RAZORPAY_KEY_SECRET")))
                payment = client.payment.fetch(session_id)

                if payment["status"] == "captured":
                    with transaction.atomic():
                        order.payment_status = "paid"
                        order.razorpay_session_id = session_id
                        order.save()
                        self.deduct_stock(order_items)
                    self.send_all_notifications(order, order_items)
                    return Response({"message": "payment_successful"}, status=status.HTTP_200_OK)

                elif payment["status"] in ["failed", "cancelled"]:
                    return Response({"message": "cancelled"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"message": f"Payment status: {payment['status']}"}, status=status.HTTP_400_BAD_REQUEST)

            except razorpay.errors.BadRequestError as e:
                return Response({"message": f"Razorpay error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Unexpected Razorpay error: {str(e)}")
                return Response({"message": "Razorpay processing error"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Missing session_id or paypal_capture_id"}, status=status.HTTP_400_BAD_REQUEST)

