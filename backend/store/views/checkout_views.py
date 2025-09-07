from .common import *
import razorpay
import os
from decouple import config
import requests


def send_notification(user=None, vendor=None, order=None, order_item=None):
    Notification.objects.create(user=user, vendor=vendor, order=order, order_item=order_item)
# paypal_api_url = f"https://api.sandbox.paypal.com/v2/checkout/orders/{paypal_order_id}"
#order-id is not used, capture id is used in paypal

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


def get_paypal_access_token(client_id, secret_id):
    token_url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"
    headers = {"Accept": "application/json", "Accept-Language": "en_US"}
    data = {"grant_type": "client_credentials"}

    response = requests.post(
        token_url,
        headers=headers,
        data=data,
        auth=(client_id, secret_id),
    )

    if response.status_code != 200:
        print("⚠️ PayPal Token Error:", response.status_code, response.text)
        raise Exception(f"PayPal auth failed: {response.text}")

    return response.json().get("access_token")



class PaymentSuccessView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    queryset = CartOrder.objects.all()
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.data

        order_id = payload.get("order_id")
        session_id = payload.get("session_id")  # Razorpay
        paypal_order_id = payload.get("paypal_order_id")  # PayPal order (for logs only)
        capture_id = payload.get("paypal_capture_id")  # PayPal capture ID

        print("Backend received paypal_order_id:", paypal_order_id)
        print("Backend received paypal_capture_id:", capture_id)

        if not order_id:
            return Response(
                {"message": "Missing order_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = CartOrder.objects.get(oid=order_id)
        except CartOrder.DoesNotExist:
            return Response(
                {"message": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.payment_status == "paid":
            return Response({"message": "already_paid"}, status=status.HTTP_200_OK)

        order_items = CartOrderItem.objects.filter(order=order)

        # -------------------- PAYPAL FLOW --------------------
        if capture_id:  # ✅ check for capture_id instead
            access_token = get_paypal_access_token(
                config("PAYPAL_CLIENT_ID"), config("PAYPAL_CLIENT_SECRET")
            )
            paypal_api_url = f"https://api-m.sandbox.paypal.com/v2/payments/captures/{capture_id}"  # ✅ fixed domain
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            }
            print("Auth Header:", headers["Authorization"])
            response = requests.get(paypal_api_url, headers=headers)
            print("PayPal Debug:", response.status_code, response.text)

            if response.status_code == 200:
                paypal_order_data = response.json()
                paypal_payment_status = paypal_order_data.get("status")

                if paypal_payment_status == "COMPLETED":
                    if order.payment_status in ["initiated", "processing", "pending"]:
                        order.payment_status = "paid"
                        order.save()
                        # 🔔 notifications & emails
                        self.send_all_notifications(order, order_items)
                        return Response(
                            {"message": "payment_successful"},
                            status=status.HTTP_200_OK,
                        )
                    return Response({"message": "Already Paid"}, status=status.HTTP_200_OK)

                elif paypal_payment_status in ["PENDING", "IN_PROGRESS"]:
                    # still valid, just waiting for PayPal review
                    order.payment_status = "processing"
                    order.save()
                    return Response(
                        {"message": f"Payment is {paypal_payment_status.lower()}"},
                        status=status.HTTP_202_ACCEPTED,
                    )

                else:
                    return Response(
                        {"message": f"Payment failed with status: {paypal_payment_status}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # -------------------- RAZORPAY FLOW --------------------
        if session_id:
            key_id = config("RAZORPAY_KEY_ID")
            key_secret = config("RAZORPAY_KEY_SECRET")
            client = razorpay.Client(auth=(key_id, key_secret))
            client.set_app_details({"title": "Django", "version": "4.2"})
            payment = client.payment.fetch(session_id)

            if payment["status"] == "captured":
                if order.payment_status in ["initiated", "pending", "processing"]:
                    order.payment_status = "paid"
                    order.stripe_session_id = session_id
                    order.save()
                    # 🔔 notifications & emails
                    self.send_all_notifications(order, order_items)
                    return Response(
                        {"message": "payment_successful"},
                        status=status.HTTP_200_OK,
                    )
                return Response({"message": "Already Paid"}, status=status.HTTP_200_OK)

            elif payment["status"] in ["failed", "cancelled"]:
                return Response({"message": "cancelled"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "unpaid"}, status=status.HTTP_400_BAD_REQUEST)

        # If neither PayPal nor Razorpay IDs are provided
        return Response(
            {"message": "Missing session_id or paypal_capture_id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def send_all_notifications(self, order, order_items):
        """Helper for notifications & emails to avoid duplication"""
        if order.buyer:
            send_notification(user=order.buyer, order=order)

        for o in order_items:
            send_notification(vendor=o.vendor, order=order, order_item=o)
