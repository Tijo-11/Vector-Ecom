from .common import *
import razorpay
import os
from decouple import config


def send_notification(user=None, vendor=None, order=None, order_item=None):
    Notification.objects.create(user=user, vendor=vendor, order=order, order_item=order_item)


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

        # Check for API credentials
        key_id = config('RAZORPAY_KEY_ID')
        key_secret = config('RAZORPAY_KEY_SECRET')
        if not key_id or not key_secret:
            return Response(
                {'message': 'Razorpay API credentials are missing or invalid'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            client.set_app_details({"title": "Django", "version": "4.2"})
            razorpay_order = client.order.create({
                'amount': int(order.total * 100),  # In paise
                'currency': 'INR',
                'payment_capture': 1,  # Auto-capture
                'notes': {
                    'store_name': 'RetroRelics'  # 👈 Your custom store name
                }
            })
            order.stripe_session_id = razorpay_order['id']  # Store Razorpay order ID
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


class PaymentSuccessView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    queryset = CartOrder.objects.all()
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        start_time = time.time()  # Log start time for performance tracking
        order_id = self.kwargs['order_id']
        session_id = request.data.get('session_id')

        if not order_id or not session_id:
            print(f"Missing order_id: {order_id}, session_id: {session_id}")
            return Response(
                {'message': 'Missing order_id or session_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = CartOrder.objects.get(oid=order_id)
            #print(f"Order found: {order_id}, current status: {order.payment_status}")
        except CartOrder.DoesNotExist:
            #print(f"Order not found: {order_id}")
            return Response(
                {'message': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if order is already paid to handle duplicate requests
        if order.payment_status == 'paid':
            #print(f"Order {order_id} already paid, session_id: {session_id}")
            return Response(
                {'message': 'already_paid'},
                status=status.HTTP_200_OK
            )

        order_items = CartOrderItem.objects.filter(order=order)

        # Check Razorpay API credentials
        key_id = config('RAZORPAY_KEY_ID')
        key_secret = config('RAZORPAY_KEY_SECRET')
        if not key_id or not key_secret:
            print("Razorpay API credentials missing")
            return Response(
                {'message': 'Razorpay API credentials are missing'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            client.set_app_details({"title": "Django", "version": "4.2"})

            # Verify payment status
            payment = client.payment.fetch(session_id)
            #print(f"Razorpay payment response: {payment}")
            if payment['status'] == 'captured':
                if order.payment_status in ['initiated', 'pending', 'processing']:
                    order.payment_status = 'paid'
                    order.stripe_session_id = session_id  # Store Razorpay payment ID
                    order.save()
                    #print(f"Order {order_id} updated to paid, session_id: {session_id}")

                    # Send Notification to customer
                    if order.buyer is not None:
                        try:
                            send_notification(user=order.buyer, order=order)
                        except Exception as e:
                            print(f"Failed to send notification to buyer {order.buyer}: {str(e)}")

                    # Send notifications to Vendor
                    for o in order_items:
                        try:
                            send_notification(vendor=o.vendor, order=order, order_item=o)
                        except Exception as e:
                            print(f"Failed to send notification to vendor {o.vendor}: {str(e)}")

                    # Send Email to Buyer
                    try:
                        merge_data = {
                            'order': order,
                            'order_items': order_items,
                        }
                        subject = "Order Placed Successfully"
                        text_body = render_to_string("email/customer_order_confirmation.txt", merge_data)
                        html_body = render_to_string("email/customer_order_confirmation.html", merge_data)
                        msg = EmailMultiAlternatives(
                            subject=subject,
                            body=text_body,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to=[order.email],
                        )
                        msg.attach_alternative(html_body, "text/html")
                        msg.send()
                    except Exception as e:
                        print(f"Failed to send email to buyer {order.email}: {str(e)}")

                    # Send Email to vendor
                    for o in order_items:
                        try:
                            if not o.vendor:
                                print(f"No vendor associated with order item {o.oid}")
                                continue
                            if not o.vendor.email:
                                print(f"Vendor {o.vendor.name} has no email address")
                                continue
                            from django.core.validators import validate_email
                            validate_email(o.vendor.email)  # Raises ValidationError if invalid
                            merge_data = {
                                'order': order,
                                'order_items': order_items,
                            }
                            subject = "New Sale!"
                            text_body = render_to_string("email/vendor_order_sale.txt", merge_data)
                            html_body = render_to_string("email/vendor_order_sale.html", merge_data)
                            msg = EmailMultiAlternatives(
                                subject=subject,
                                body=text_body,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                to=[o.vendor.email],
                            )
                            msg.attach_alternative(html_body, "text/html")
                            msg.send()
                            print(f"Email sent to vendor {o.vendor.email}")
                        except Exception as e:
                            print(f"Failed to send email to vendor {o.vendor.email if o.vendor else 'None'}: {str(e)}")

                    print(f"Request processing time: {time.time() - start_time:.2f} seconds")
                    return Response(
                        {'message': 'payment_successful'},
                        status=status.HTTP_200_OK
                    )
            elif payment['status'] in ['failed', 'cancelled']:
                print(f"Payment {session_id} failed or cancelled: {payment['status']}")
                return Response(
                    {'message': 'cancelled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            print(f"Payment {session_id} status: {payment['status']}")
            return Response(
                {'message': 'unpaid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except razorpay.errors.BadRequestError as e:
            print(f"Razorpay error for payment {session_id}: {str(e)}")
            return Response(
                {'message': f'Payment verification failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Unexpected error in PaymentSuccessView: {str(e)}")
            return Response(
                {'message': 'Server error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
