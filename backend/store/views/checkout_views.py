from .common import *
import razorpay
import os
from decouple import config

class RazorpayCheckoutView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = [AllowAny]
    queryset = CartOrder.objects.all()

    def create(self, request, *args, **kwargs):
        order_id = self.kwargs['order_id']
        try:
            order = CartOrder.objects.get(oid=order_id)
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
                'payment_capture': 1  # Auto-capture
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
            
class PaymentSuccessView(generics.CreateAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        order_id = self.kwargs['order_id']
        session_id = request.data.get('session_id')

        if not order_id or not session_id:
            return Response(
                {'message': 'Missing order_id or session_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = CartOrder.objects.get(oid=order_id)
        except CartOrder.DoesNotExist:
            return Response(
                {'message': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check Razorpay API credentials
        key_id = config('RAZORPAY_KEY_ID')
        key_secret = config('RAZORPAY_KEY_SECRET')
        if not key_id or not key_secret:
            return Response(
                {'message': 'Razorpay API credentials are missing'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            client.set_app_details({"title": "Django", "version": "4.2"})

            # Verify payment status
            payment = client.payment.fetch(session_id)
            if payment['status'] == 'captured':
                if order.payment_status == 'pending':
                    order.payment_status = 'paid'
                    order.save()
                    return Response(
                        {'message': 'payment_successful'},
                        status=status.HTTP_200_OK
                    )
                return Response(
                    {'message': 'already_paid'},
                    status=status.HTTP_200_OK
                )
            elif payment['status'] == 'failed' or payment['status'] == 'cancelled':
                return Response(
                    {'message': 'cancelled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'message': 'unpaid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except razorpay.errors.BadRequestError as e:
            return Response(
                {'message': f'Payment verification failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )