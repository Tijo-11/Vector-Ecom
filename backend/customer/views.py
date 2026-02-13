#Django Packages
from django.db.models import Q
import logging
from django.conf import settings
from django.shortcuts import get_object_or_404

# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.views import APIView

# Serializers
from userauth.serializers import ProfileSerializer
from store.serializers import CartOrderSerializer, WishlistSerializer, NotificationSerializer

# Models
from userauth.models import Profile, User, Wallet, WalletTransaction
from store.models import Product, CartOrder, Wishlist, Notification

import razorpay
from decimal import Decimal

# Setup logger
logger = logging.getLogger(__name__)
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class OrdersAPIView(generics.ListAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        logger.info("=" * 50)
        logger.info("OrdersAPIView - get_queryset called")
        logger.info(f"User authenticated: {self.request.user.is_authenticated}")
        logger.info(f"Current user: {self.request.user}")
        logger.info(f"User ID: {self.request.user.id if self.request.user.is_authenticated else 'None'}")
        logger.info(f"Auth header: {self.request.META.get('HTTP_AUTHORIZATION', 'No auth header')}")
        
        user_id = self.kwargs['user_id']
        logger.info(f"Requested user_id from URL: {user_id}")
        
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user: {user.username} (ID: {user.id})")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
            raise

        orders = CartOrder.objects.filter(
            Q(buyer=user) & (Q(payment_status="paid") | Q(payment_status="processing") | Q(payment_status="cancelled")))
        logger.info(f"Found {orders.count()} orders for user {user.username}")
        logger.info("=" * 50)
        return orders


class OrdersDetailAPIView(generics.RetrieveAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'user_id'

    def get_object(self):
        logger.info("=" * 50)
        logger.info("OrdersDetailAPIView - get_object called")
        logger.info(f"User authenticated: {self.request.user.is_authenticated}")
        logger.info(f"Current user: {self.request.user}")
        
        user_id = self.kwargs['user_id']
        order_oid = self.kwargs['order_oid']
        logger.info(f"Requested user_id: {user_id}, order_oid: {order_oid}")

        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user: {user.username}")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
            raise

        try:
            order = CartOrder.objects.get(
                Q(payment_status="paid") | Q(payment_status="processing") | Q(payment_status="cancelled"),
                buyer=user,
                oid=order_oid
            )
            logger.info(f"Found order: {order.oid}")
        except CartOrder.DoesNotExist:
            logger.error(f"Order {order_oid} not found for user {user.username}")
            raise
        
        logger.info("=" * 50)
        return order

    
class WishlistCreateAPIView(generics.CreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = (IsAuthenticated,)

    def create(self, request):
        logger.info("=" * 50)
        logger.info("WishlistCreateAPIView - create called")
        logger.info(f"User authenticated: {request.user.is_authenticated}")
        logger.info(f"Current user: {request.user}")
        
        payload = request.data
        logger.info(f"Payload received: {payload}")

        product_id = payload['product_id']
        user_id = payload['user_id']
        logger.info(f"Product ID: {product_id}, User ID: {user_id}")

        try:
            product = Product.objects.get(id=product_id)
            logger.info(f"Found product: {product.title}")
        except Product.DoesNotExist:
            logger.error(f"Product with ID {product_id} does not exist")
            raise

        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user: {user.username}")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
            raise

        wishlist = Wishlist.objects.filter(product=product, user=user)
        if wishlist.exists():
            logger.info(f"Wishlist item exists, deleting for user {user.username}")
            wishlist.delete()
            logger.info("=" * 50)
            return Response({"message": "Removed From Wishlist"}, status=status.HTTP_200_OK)
        else:
            logger.info(f"Creating new wishlist item for user {user.username}")
            wishlist = Wishlist.objects.create(
                product=product,
                user=user,
            )
            logger.info(f"Wishlist item created with ID: {wishlist.id}")
            logger.info("=" * 50)
            return Response({"message": "Added To Wishlist"}, status=status.HTTP_201_CREATED)

        
class WishlistAPIView(generics.ListAPIView):
    serializer_class = WishlistSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        logger.info("=" * 50)
        logger.info("WishlistAPIView - get_queryset called")
        logger.info(f"User authenticated: {self.request.user.is_authenticated}")
        logger.info(f"Current user: {self.request.user}")
        
        user_id = self.kwargs['user_id']
        logger.info(f"Requested user_id: {user_id}")
        
        if not str(user_id).isdigit():
            logger.warning(f"Invalid user_id format: {user_id}")
            logger.info("=" * 50)
            return Wishlist.objects.none()
        
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user: {user.username}")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
            raise

        wishlist = Wishlist.objects.filter(user=user)
        logger.info(f"Found {wishlist.count()} wishlist items for user {user.username}")
        logger.info("=" * 50)
        return wishlist


class CustomerNotificationView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise

        notifications = Notification.objects.filter(user=user)
        
        # Optional filter by seen status
        seen_param = self.request.query_params.get('seen')
        if seen_param is not None:
            seen_val = seen_param.lower() in ('true', '1')
            notifications = notifications.filter(seen=seen_val)
        
        return notifications.order_by('-date')

    
class MarkNotificationsAsSeen(generics.RetrieveAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_object(self):
        user_id = self.kwargs['user_id']
        noti_id = self.kwargs['noti_id']

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise

        try:
            notification = Notification.objects.get(id=noti_id, user=user)
        except Notification.DoesNotExist:
            raise

        # Toggle seen status
        notification.seen = not notification.seen
        notification.save()
        
        return notification


class CustomerUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_object(self):
        logger.info("=" * 50)
        logger.info("CustomerUpdateView - get_object called")
        logger.info(f"User authenticated: {self.request.user.is_authenticated}")
        logger.info(f"Current user: {self.request.user}")
        logger.info(f"Request method: {self.request.method}")
        
        user_id = self.kwargs['user_id']
        logger.info(f"Requested user_id: {user_id}")
        
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user: {user.username}")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
            raise
        
        try:
            profile = Profile.objects.get(user=user)
            logger.info(f"Found profile for user: {user.username}")
        except Profile.DoesNotExist:
            logger.error(f"Profile not found for user {user.username}")
            raise
        
        logger.info("=" * 50)
        return profile
    
#------Wallet views--------------
class WalletView(APIView):
    permission_classes = [IsAuthenticated,]
    
    def get(self, request, user_id):
        if request.user.id != user_id:
            return Response({"error": "Unauthorized"},status=status.HTTP_403_FORBIDDEN)
        wallet, created = Wallet.objects.get_or_create(user_id=user_id)
        return Response({'balance':str(wallet.balance),
                        "currency": wallet.currency})
        
class DepositView(APIView):
    permission_classes = [IsAuthenticated,]
    
    def post(self, request, user_id):
        if request.user.id != user_id:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        amount = request.data.get("amount")
        if not amount or Decimal(amount) <=0:
            return Response({'error':"Invalid amount"}, status = status.HTTP_400_BAD_REQUEST)
        amount_in_paise = int(Decimal(amount)*100)
        
        order_data = {
            'amount':amount_in_paise,
            'currency': "INR",
            "receipt": f"deposit_{request.user.id}"
        }
        order = client.order.create(order_data)
        return Response({
            "order_id": order["id"],
            "amount": amount_in_paise,
            "key": settings.RAZORPAY_KEY_ID  # Public key for frontend
        })
        
class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        if request.user.id != user_id:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_signature = request.data.get("razorpay_signature")
        
        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return Response({"error": "Missing payment data"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })
        # Fetch amount from order
            order = client.order.fetch(razorpay_order_id)
            amount = Decimal(order["amount"]) / 100
            wallet = request.user.wallet
            wallet.deposit(amount)
        
            return Response({"status": "success", "message": "Wallet credited successfully"})
        except razorpay.errors.SignatureVerificationError:
            return Response({"error": "Payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class WithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.id != user_id:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        amount = request.data.get("amount")
        if not amount or Decimal(amount) <= 0:
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        wallet = request.user.wallet
        try:
            wallet.withdraw(
                amount=Decimal(amount),
                transaction_type='withdrawal',
                description='Manual wallet withdrawal'
            )
            return Response({
                "status": "success",
                "message": "Withdrawal successful (internal deduction)",
                "new_balance": str(wallet.balance)
            })
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomerWalletTransactionsView(APIView):
    """List all wallet transactions for a customer."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        wallet, _ = Wallet.objects.get_or_create(user_id=user_id)

        transactions = WalletTransaction.objects.filter(
            wallet=wallet
        ).select_related('related_order', 'related_order_item').order_by('-created_at')

        # Optional type filter
        type_filter = request.query_params.get('type')
        if type_filter:
            transactions = transactions.filter(transaction_type=type_filter)

        data = []
        for tx in transactions:
            tx_data = {
                'id': tx.id,
                'transaction_id': tx.transaction_id,
                'transaction_type': tx.transaction_type,
                'transaction_type_display': tx.get_transaction_type_display(),
                'amount': str(tx.amount),
                'balance_after': str(tx.balance_after),
                'description': tx.description,
                'created_at': tx.created_at.isoformat(),
            }

            if tx.related_order:
                tx_data['related_order'] = {
                    'oid': tx.related_order.oid,
                    'total': str(tx.related_order.total),
                    'order_status': tx.related_order.order_status,
                    'payment_status': tx.related_order.payment_status,
                }

            data.append(tx_data)

        return Response({
            'transactions': data,
            'balance': str(wallet.balance),
            'currency': wallet.currency,
        })
