#Django Packages
from django.db.models import Q
import logging

# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# Serializers
from userauth.serializers import ProfileSerializer
from store.serializers import CartOrderSerializer, WishlistSerializer, NotificationSerializer

# Models
from userauth.models import Profile, User 
from store.models import Product, CartOrder, Wishlist, Notification

# Setup logger
logger = logging.getLogger(__name__)


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
        logger.info("=" * 50)
        logger.info("CustomerNotificationView - get_queryset called")
        logger.info(f"User authenticated: {self.request.user.is_authenticated}")
        logger.info(f"Current user: {self.request.user}")
        
        user_id = self.kwargs['user_id']
        logger.info(f"Requested user_id: {user_id}")
        
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user: {user.username}")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
            raise

        notifications = Notification.objects.filter(user=user, seen=False)
        logger.info(f"Found {notifications.count()} unseen notifications for user {user.username}")
        logger.info("=" * 50)
        return notifications

    
class MarkNotificationsAsSeen(generics.RetrieveAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_object(self):
        logger.info("=" * 50)
        logger.info("MarkNotificationsAsSeen - get_object called")
        logger.info(f"User authenticated: {self.request.user.is_authenticated}")
        logger.info(f"Current user: {self.request.user}")
        
        user_id = self.kwargs['user_id']
        noti_id = self.kwargs['noti_id']
        logger.info(f"Requested user_id: {user_id}, notification_id: {noti_id}")

        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user: {user.username}")
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist")
            raise

        try:
            notification = Notification.objects.get(id=noti_id, user=user)
            logger.info(f"Found notification ID: {notification.id}, seen status: {notification.seen}")
        except Notification.DoesNotExist:
            logger.error(f"Notification {noti_id} not found for user {user.username}")
            raise

        if not notification.seen:
            logger.info("Marking notification as seen")
            notification.seen = True
            notification.save()
            logger.info("Notification marked as seen")
        else:
            logger.info("Notification already marked as seen")
        
        logger.info("=" * 50)
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