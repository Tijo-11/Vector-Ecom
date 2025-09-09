from django.urls import path
from .views import OrdersAPIView, OrdersDetailAPIView, WishlistCreateAPIView, WishlistAPIView
from .views import CustomerNotificationView, CustomerUpdateView

 # Customer API Endpoints
urlpatterns = [
    path('customer/orders/<user_id>/', OrdersAPIView.as_view(), name='customer-orders'),
    path('customer/order/detail/<user_id>/<order_oid>/', OrdersDetailAPIView.as_view(), name='customer-order-detail'),
    path('customer/wishlist/create/', WishlistCreateAPIView.as_view(), name='customer-wishlist-create'),
    path('customer/wishlist/<user_id>/', WishlistAPIView.as_view(), name='customer-wishlist'),
    path('customer/notification/<user_id>/', CustomerNotificationView.as_view(), name='customer-notification'),
    path('customer/setting/<int:pk>/', CustomerUpdateView.as_view(), name='customer-settings'),]