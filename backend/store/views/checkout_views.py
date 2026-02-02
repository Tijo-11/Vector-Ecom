# checkout_views.py (Removed tax_fee and service_fee from calculations)
import razorpay
from decouple import config
import os
import requests
import logging
from django.db import transaction
import json
# Django Packages
from django.conf import settings
from django.template.loader import render_to_string
# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics,status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
# Serializers
from store.serializers import CartOrderSerializer
from userauth.tasks import send_async_email
# Models
from store.models import CartOrderItem,Notification, CartOrder, Cart
from userauth.models import User, Wallet
#other packages
import time


# Set up logging
logger = logging.getLogger(__name__)

def send_notification(user=None, vendor=None, order=None, order_item=None):
    """Create a notification and log any failures."""
    logger.info("Sending notification")
    try:
        Notification.objects.create(user=user, vendor=vendor, order=order, order_item=order_item)
        logger.info(f"Notification created for order {order.id if order else 'unknown'}")
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")

def send_email(subject, text_body, html_body, from_email, to_email):
    """Send an email asynchronously using Celery."""
    logger.info(f"Sending email to {to_email} with subject: {subject}")
    send_async_email.delay(
        subject=subject,
        message=text_body,
        html_message=html_body,
        from_email=from_email,
        recipient_list=[to_email],
        fail_silently=False
    )
    logger.info(f"Email task queued for {to_email}")

def get_paypal_access_token(client_id, secret_id):
    """Fetch PayPal access token."""
    logger.info("Fetching PayPal access token")
    token_url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"
    headers = {"Accept": "application/json", "Accept-Language": "en_US"}
    data = {"grant_type": "client_credentials"}
    try:
        response = requests.post(token_url, headers=headers, data=data, auth=(client_id, secret_id))
        response.raise_for_status()
        access_token = response.json().get("access_token")
        logger.info("PayPal access token fetched successfully")
        return access_token
    except Exception as e:
        logger.error(f"PayPal auth failed: {str(e)}")
        raise

def send_all_notifications(order, order_items):
    """Send notifications and emails asynchronously."""
    logger.info(f"Sending all notifications for order {order.oid}")
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
    vendor_groups = {}
    for item in order_items:
        if item.vendor and item.vendor.email and "@" in item.vendor.email:
            vendor_groups.setdefault(item.vendor.id, []).append(item)
    for vendor_id, items in vendor_groups.items():
        vendor_email = items[0].vendor.email
        try:
            for item in items:
                send_notification(vendor=item.vendor, order=order, order_item=item)
            merge_data = {'order': order, 'order_items': items}
            subject = "New Sale!"
            text_body = render_to_string("email/vendor_order_sale.txt", merge_data)
            html_body = render_to_string("email/vendor_order_sale.html", merge_data)
            send_email(subject, text_body, html_body, settings.DEFAULT_FROM_EMAIL, vendor_email)
        except Exception as e:
            logger.error(f"Vendor notification failed for {vendor_email}: {str(e)}")
    logger.info(f"All notifications sent for order {order.oid}")

def deduct_stock(order_items):
    """Decrease product stock after successful payment."""
    logger.info("Deducting stock for order items")
    for item in order_items:
        product = item.product
        if product.stock_qty >= item.qty:
            product.stock_qty -= item.qty
            product.save()
            logger.info(f"Stock updated: {product.title} -{item.qty}")
        else:
            logger.warning(f"Insufficient stock for {product.title} during payment success.")

def deactivate_cart(cart_id, user_id=None):
    """Mark all Cart entries associated with the cart_id as inactive."""
    logger.info(f"Deactivating cart for cart_id={cart_id}, user_id={user_id}")
    try:
        cart_items = Cart.objects.filter(cart_id=cart_id, is_active=True)
        if user_id:
            cart_items = cart_items.filter(user_id=user_id)
        for item in cart_items:
            item.is_active = False
            item.save()
            logger.info(f"Deactivated cart item: {item.id} for cart_id={cart_id}")
    except Exception as e:
        logger.error(f"Failed to deactivate cart items for cart_id={cart_id}: {str(e)}")

class RazorpayCheckoutView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = [AllowAny]
    queryset = CartOrder.objects.all()
    def create(self, request, *args, **kwargs):
        logger.info("Entering RazorpayCheckoutView.create")
        order_id = self.kwargs['order_id']
        logger.debug(f"Processing order_id: {order_id}")
        try:
            order = CartOrder.objects.get(oid=order_id)
            if order.payment_status == "paid":
                logger.warning(f"Order {order_id} already paid")
                return Response({'message': 'Already paid', 'icon': 'warn'}, status=status.HTTP_200_OK)
        except CartOrder.DoesNotExist:
            logger.error(f"Order not found: {order_id}")
            return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        key_id = os.environ.get('RAZORPAY_KEY_ID', config('RAZORPAY_KEY_ID'))
        key_secret = os.environ.get('RAZORPAY_KEY_SECRET', config('RAZORPAY_KEY_SECRET'))
        if not key_id or not key_secret:
            logger.error("Razorpay API credentials are missing or invalid")
            return Response(
                {'message': 'Razorpay API credentials are missing or invalid'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        try:
            logger.info("Initializing Razorpay client")
            client = razorpay.Client(auth=(key_id, key_secret))
            client.set_app_details({"title": config('APP_TITLE', 'Django'), "version": config('APP_VERSION', '4.2')})
            logger.info(f"Creating Razorpay order for amount: {int(order.total * 100)}")
            razorpay_order = client.order.create({
                'amount': int(order.total * 100), # In paise
                'currency': 'INR',
                'payment_capture': 1,
                'notes': {'store_name': config('STORE_NAME', 'RetroRelics')}
            })
            order.razorpay_order_id = razorpay_order['id']
            order.save()
            logger.info(f"Razorpay order created successfully: {razorpay_order['id']}")
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
            logger.error(f"Razorpay BadRequestError: {error_message}")
            if 'authentication failed' in error_message.lower():
                return Response(
                    {'message': 'Razorpay authentication failed. Please check API credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return Response(
                {'message': f'Error creating Razorpay order: {error_message}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in Razorpay order creation: {str(e)}")
            return Response(
                {'message': 'Unexpected error creating Razorpay order'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentSuccessView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    queryset = CartOrder.objects.all()
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        logger.info("Entering PaymentSuccessView.post")
        start_time = time.time() # noqa
        payload = request.data
        order_id = payload.get("order_id")
        session_id = payload.get("session_id") # Razorpay payment_id
        capture_id = payload.get("paypal_capture_id") # PayPal
        logger.debug(f"Processing payment for order_id: {order_id}, session_id: {session_id}, capture_id: {capture_id}")
        if not order_id:
            logger.warning("Missing order_id in payload")
            return Response({"message": "Missing order_id"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = CartOrder.objects.get(oid=order_id)
            logger.info(f"Retrieved order: {order.oid}")
        except CartOrder.DoesNotExist:
            logger.error(f"Order not found: {order_id}")
            return Response({"message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if order.payment_status == "paid":
            logger.warning(f"Order {order_id} already paid")
            return Response({"message": "already_paid"}, status=status.HTTP_200_OK)
        order_items = CartOrderItem.objects.filter(order=order)
        logger.debug(f"Found {order_items.count()} order items")
        # --- PayPal flow ---
        if capture_id:
            logger.info(f"Processing PayPal payment with capture_id: {capture_id}")
            try:
                access_token = get_paypal_access_token(
                    os.environ.get('PAYPAL_CLIENT_ID', config('PAYPAL_CLIENT_ID')),
                    os.environ.get('PAYPAL_CLIENT_SECRET', config('PAYPAL_CLIENT_SECRET'))
                )
                paypal_api_url = f"https://api-m.sandbox.paypal.com/v2/payments/captures/{capture_id}"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                }
                response = requests.get(paypal_api_url, headers=headers)
                logger.info(f"PayPal API response status: {response.status_code}")
                if response.status_code == 200:
                    paypal_data = response.json()
                    status_val = paypal_data.get("status")
                    logger.info(f"PayPal payment status: {status_val}")
                    logger.info(f"PayPal status details: {paypal_data.get('status_details')}")
                    is_sandbox = "sandbox" in paypal_api_url
                    if status_val == "COMPLETED" or (status_val == "PENDING" and is_sandbox):
                        with transaction.atomic():
                            locked_order = CartOrder.objects.select_for_update().get(oid=order_id)
                            if locked_order.payment_status == "paid":
                                logger.warning(f"Order {order_id} already paid (locked check)")
                                return Response({"message": "already_paid"}, status=status.HTTP_200_OK)
                            locked_order.payment_status = "paid"
                            locked_order.order_status = "Confirmed"
                            locked_order.payment_method = "Paypal"
                            locked_order.paypal_capture_id = capture_id
                           
                            # ============================================
                            # MARK COUPONS AS USED BY THIS USER
                            # ============================================
                            if locked_order.buyer and locked_order.coupons.exists():
                                for coupon in locked_order.coupons.all():
                                    coupon.used_by.add(locked_order.buyer)
                                    logger.info(f"Marked coupon {coupon.code} as used by user {locked_order.buyer.id}")
                           
                            locked_order.save()
                            deactivate_cart(locked_order.oid, locked_order.buyer_id if locked_order.buyer else None)
                            deduct_stock(order_items)
                        try:
                            send_all_notifications(locked_order, order_items)
                        except Exception as e:
                            logger.error(f"Notification failed: {str(e)}")
                        logger.info(f"PayPal payment successful for order {order_id}")
                        return Response({"message": "payment_successful"}, status=status.HTTP_200_OK)
                    elif status_val in ["PENDING", "IN_PROGRESS"] and not is_sandbox:
                        with transaction.atomic():
                            locked_order = CartOrder.objects.select_for_update().get(oid=order_id)
                            if locked_order.payment_status == "processing":
                                logger.info(f"Order {order_id} already processing (locked check)")
                                return Response({"message": f"Payment is {status_val.lower()}"}, status=status.HTTP_202_ACCEPTED)
                            locked_order.payment_status = "processing"
                            locked_order.order_status = "Pending"
                            locked_order.paypal_capture_id = capture_id
                            locked_order.save()
                        logger.info(f"PayPal payment {status_val.lower()} for order {order_id}")
                        return Response({"message": f"Payment is {status_val.lower()}"}, status=status.HTTP_202_ACCEPTED)
                    else:
                        logger.warning(f"PayPal payment failed: {status_val}")
                        return Response({"message": f"Payment failed: {status_val}"}, status=status.HTTP_400_BAD_REQUEST)
                logger.error("PayPal API error")
                return Response({"message": "PayPal API error"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"PayPal processing error: {str(e)}")
                return Response({"message": "PayPal processing error"}, status=status.HTTP_400_BAD_REQUEST)
        # --- Razorpay flow ---
        if session_id:
            logger.info(f"Processing Razorpay payment with session_id: {session_id}")
            try:
                client = razorpay.Client(auth=(config("RAZORPAY_KEY_ID"), config("RAZORPAY_KEY_SECRET")))
                payment = client.payment.fetch(session_id)
                payment_status = payment["status"]
                logger.info(f"Razorpay payment status: {payment_status}")
                if payment_status == "captured":
                    with transaction.atomic():
                        locked_order = CartOrder.objects.select_for_update().get(oid=order_id)
                        if locked_order.payment_status == "paid":
                            logger.warning(f"Order {order_id} already paid (locked check)")
                            return Response({"message": "already_paid"}, status=status.HTTP_200_OK)
                        locked_order.payment_status = "paid"
                        locked_order.order_status = "Confirmed"
                        locked_order.payment_method = "Credit/Debit Card"
                        locked_order.razorpay_payment_id = session_id
                       
                        # ============================================
                        # MARK COUPONS AS USED BY THIS USER
                        # ============================================
                        if locked_order.buyer and locked_order.coupons.exists():
                            for coupon in locked_order.coupons.all():
                                coupon.used_by.add(locked_order.buyer)
                                logger.info(f"Marked coupon {coupon.code} as used by user {locked_order.buyer.id}")
                       
                        locked_order.save()
                        deactivate_cart(locked_order.oid, locked_order.buyer_id if locked_order.buyer else None)
                        deduct_stock(order_items)
                    try:
                        send_all_notifications(locked_order, order_items)
                    except Exception as e:
                        logger.error(f"Notification failed: {str(e)}")
                    logger.info(f"Razorpay payment successful for order {order_id}")
                    return Response({"message": "payment_successful"}, status=status.HTTP_200_OK)
                elif payment_status == "authorized":
                    logger.info(f"Razorpay payment authorized for order {order_id}")
                    return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)
                elif payment_status in ["failed", "cancelled"]:
                    logger.warning(f"Razorpay payment {payment_status} for order {order_id}")
                    return Response({"message": "cancelled"}, status=status.HTTP_400_BAD_REQUEST)
                elif payment_status in ["created", "pending"]:
                    with transaction.atomic():
                        locked_order = CartOrder.objects.select_for_update().get(oid=order_id)
                        if locked_order.payment_status == "processing":
                            logger.info(f"Order {order_id} already processing (locked check)")
                            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)
                        locked_order.payment_status = "processing"
                        locked_order.razorpay_payment_id = session_id
                        locked_order.save()
                    logger.info(f"Razorpay payment {payment_status} for order {order_id}")
                    return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)
                else:
                    logger.warning(f"Unknown Razorpay payment status: {payment_status}")
                    return Response({"message": f"Payment status: {payment_status}"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Razorpay processing error: {str(e)}")
                return Response({"message": "Razorpay processing error"}, status=status.HTTP_400_BAD_REQUEST)
        logger.warning("Missing session_id or paypal_capture_id in payload")
        return Response({"message": "Missing session_id or paypal_capture_id"}, status=status.HTTP_400_BAD_REQUEST)

# store/views/checkout_views.py - Updated PayPalWebhookView
class PayPalWebhookView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        logger.info("Entering PayPalWebhookView.post")
        payload = request.body
        sig_header = request.META.get('HTTP_PAYPAL_TRANSMISSION_SIG')
        transmission_id = request.META.get('HTTP_PAYPAL_TRANSMISSION_ID')
        timestamp = request.META.get('HTTP_PAYPAL_TRANSMISSION_TIME')
        webhook_id = config('PAYPAL_WEBHOOK_ID')
        cert_url = request.META.get('HTTP_PAYPAL_CERT_URL')
        auth_algo = request.META.get('HTTP_PAYPAL_AUTH_ALGO')
        event_body = payload.decode('utf-8')
        event = None
        try:
            client_id = os.environ.get('PAYPAL_CLIENT_ID', config('PAYPAL_CLIENT_ID'))
            secret_id = os.environ.get('PAYPAL_CLIENT_SECRET', config('PAYPAL_CLIENT_SECRET'))
            access_token = get_paypal_access_token(client_id, secret_id)
            verify_url = "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
            verify_data = {
                "auth_algo": auth_algo,
                "cert_url": cert_url,
                "transmission_id": transmission_id,
                "transmission_sig": sig_header,
                "transmission_time": timestamp,
                "webhook_id": webhook_id,
                "webhook_event": json.loads(event_body)
            }
            response = requests.post(verify_url, headers=headers, json=verify_data)
            response.raise_for_status()
            verification = response.json()
            if verification.get('verification_status') != 'SUCCESS':
                logger.warning("PayPal webhook verification failed")
                return Response(status = status.HTTP_403_FORBIDDEN)
            event = verify_data["webhook_event"]
        except Exception as e:
            logger.error(f"PayPal webhook verification error: {str(e)}")
            return Response(status=status.HTTP_400_BAD_REQUEST)
        # Process event
        event_type = event.get('event_type')
        logger.info(f"Processing PayPal event: {event_type}")
        if event_type == 'PAYMENT.CAPTURE.COMPLETED':
            capture_id = event['resource'].get('id')
            status = event['resource'].get('status')
            if status == 'COMPLETED':
                try:
                    with transaction.atomic():
                        order = CartOrder.objects.select_for_update().get(paypal_capture_id=capture_id)
                        if order.payment_status != "paid":
                            order.payment_status = "paid"
                            order.order_status = "Confirmed"
                            order.payment_method = "Paypal"
                           
                            # ============================================
                            # MARK COUPONS AS USED BY THIS USER
                            # ============================================
                            if order.buyer and order.coupons.exists():
                                for coupon in order.coupons.all():
                                    coupon.used_by.add(order.buyer)
                                    logger.info(f"Marked coupon {coupon.code} as used by user {order.buyer.id}")
                           
                            order.save()
                            order_items = CartOrderItem.objects.filter(order=order)
                            deactivate_cart(order.oid, order.buyer_id if order.buyer else None)
                            deduct_stock(order_items)
                            send_all_notifications(order, order_items)
                        else:
                            logger.info(f"Order {order.oid} already paid")
                except CartOrder.DoesNotExist:
                    logger.error(f"Order not found for PayPal capture_id: {capture_id}")
                except Exception as e:
                    logger.error(f"Error processing completed capture: {str(e)}")
        elif event_type == 'PAYMENT.CAPTURE.DENIED':
            capture_id = event['resource'].get('id')
            try:
                with transaction.atomic():
                    order = CartOrder.objects.select_for_update().get(paypal_capture_id=capture_id)
                    if order.payment_status != "failed":
                        order.payment_status = "failed"
                        order.order_status = "Cancelled"
                        order.save()
                        # Optionally send failure notifications
            except CartOrder.DoesNotExist:
                logger.error(f"Order not found for PayPal capture_id: {capture_id}")
            except Exception as e:
                logger.error(f"Error processing denied capture: {str(e)}")
        return Response(status=status.HTTP_200_OK)


class WalletPaymentView(APIView):
    """Handle payment using wallet balance."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        logger.info("Entering WalletPaymentView.post")
        order_oid = request.data.get("order_oid")
        user_id = request.data.get("user_id")

        if not order_oid or not user_id:
            return Response(
                {"message": "Order ID and User ID are required", "icon": "error"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = CartOrder.objects.get(oid=order_oid)
        except CartOrder.DoesNotExist:
            logger.error(f"Order not found: {order_oid}")
            return Response(
                {"message": "Order not found", "icon": "error"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.error(f"User not found: {user_id}")
            return Response(
                {"message": "User not found", "icon": "error"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            wallet = Wallet.objects.get(user=user)
        except Wallet.DoesNotExist:
            logger.error(f"Wallet not found for user: {user_id}")
            return Response(
                {"message": "Wallet not found", "icon": "error"},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.payment_status == "paid":
            logger.warning(f"Order {order_oid} already paid")
            return Response(
                {"message": "Order already paid", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.buyer and order.buyer != user:
            logger.warning(f"Unauthorized wallet payment attempt for order {order_oid}")
            return Response(
                {"message": "Unauthorized", "icon": "error"},
                status=status.HTTP_403_FORBIDDEN
            )

        order_total = order.total
        if wallet.balance < order_total:
            logger.info(f"Insufficient wallet balance. Required: {order_total}, Available: {wallet.balance}")
            return Response({
                "message": f"Insufficient wallet balance. Required: ₹{order_total}, Available: ₹{wallet.balance}",
                "icon": "error"
            }, status=status.HTTP_400_BAD_REQUEST)

        order_items = CartOrderItem.objects.filter(order=order)

        with transaction.atomic():
            # Lock the order and wallet
            locked_order = CartOrder.objects.select_for_update().get(oid=order_oid)
            locked_wallet = Wallet.objects.select_for_update().get(user=user)

            # Double-check payment status and balance
            if locked_order.payment_status == "paid":
                return Response(
                    {"message": "Order already paid", "icon": "warning"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if locked_wallet.balance < order_total:
                return Response({
                    "message": f"Insufficient wallet balance. Required: ₹{order_total}, Available: ₹{locked_wallet.balance}",
                    "icon": "error"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Deduct from wallet
            locked_wallet.withdraw(
                amount=order_total,
                transaction_type='payment',
                description=f"Payment for order #{locked_order.oid}",
                related_order=locked_order
            )
            logger.info(f"Deducted ₹{order_total} from wallet for user {user_id}")

            # Update order status
            locked_order.payment_status = "paid"
            locked_order.order_status = "Confirmed"
            locked_order.payment_method = "Wallet"

            # Mark coupons as used
            if locked_order.buyer and locked_order.coupons.exists():
                for coupon in locked_order.coupons.all():
                    coupon.used_by.add(locked_order.buyer)
                    logger.info(f"Marked coupon {coupon.code} as used by user {locked_order.buyer.id}")

            locked_order.save()

            # Deactivate cart and deduct stock
            deactivate_cart(locked_order.oid, locked_order.buyer_id if locked_order.buyer else None)
            deduct_stock(order_items)

        # Send notifications outside transaction
        try:
            send_all_notifications(locked_order, order_items)
        except Exception as e:
            logger.error(f"Notification failed: {str(e)}")

        logger.info(f"Wallet payment successful for order {order_oid}")
        return Response({
            "message": "Payment successful! Amount deducted from wallet.",
            "icon": "success",
            "new_balance": str(locked_wallet.balance)
        }, status=status.HTTP_200_OK)