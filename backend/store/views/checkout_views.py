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
            #print(f"Missing order_id: {order_id}, session_id: {session_id}")  # Debugging log
            return Response(
                {'message': 'Missing order_id or session_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = CartOrder.objects.get(oid=order_id)
            #print(f"Order found: {order_id}, current status: {order.payment_status}")  # Debugging log
        except CartOrder.DoesNotExist:
            #print(f"Order not found: {order_id}")  # Debugging log
            return Response(
                {'message': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check Razorpay API credentials
        key_id = config('RAZORPAY_KEY_ID')
        key_secret = config('RAZORPAY_KEY_SECRET')
        if not key_id or not key_secret:
            #print("Razorpay API credentials missing")  # Debugging log
            return Response(
                {'message': 'Razorpay API credentials are missing'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            client.set_app_details({"title": "Django", "version": "4.2"})

            # Verify payment status
            payment = client.payment.fetch(session_id)
            #print(f"Razorpay payment response: {payment}")  # Debugging log
            if payment['status'] == 'captured':
                if order.payment_status in ['initiated', 'pending', 'processing']:
                    order.payment_status = 'paid'
                    order.stripe_session_id = session_id  # Store Razorpay payment ID
                    order.save()
                    print(f"Order {order_id} updated to paid, session_id: {session_id}")  # Debugging log
                    return Response(
                        {'message': 'payment_successful'},
                        status=status.HTTP_200_OK
                    )
                #print(f"Order {order_id} already paid, status: {order.payment_status}")  # Debugging log
                return Response(
                    {'message': 'already_paid'},
                    status=status.HTTP_200_OK
                )
            elif payment['status'] in ['failed', 'cancelled']:
                #print(f"Payment {session_id} failed or cancelled: {payment['status']}")  # Debugging log
                return Response(
                    {'message': 'cancelled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            #print(f"Payment {session_id} status: {payment['status']}")  # Debugging log
            return Response(
                {'message': 'unpaid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except razorpay.errors.BadRequestError as e:
            #print(f"Razorpay error for payment {session_id}: {str(e)}")  # Debugging log
            return Response(
                {'message': f'Payment verification failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )