from django.urls import path
from .views import OrdersAPIView, OrdersDetailAPIView, WishlistCreateAPIView, WishlistAPIView
from .views import CustomerNotificationView, CustomerUpdateView, MarkNotificationsAsSeen
from .views import WalletView, DepositView, VerifyPaymentView, WithdrawView

 # Customer API Endpoints
urlpatterns = [
    path('customer/orders/<user_id>/', OrdersAPIView.as_view(), name='customer-orders'),
    path('customer/order/detail/<user_id>/<order_oid>/', OrdersDetailAPIView.as_view(), name='customer-order-detail'),
    path('customer/wishlist/create/', WishlistCreateAPIView.as_view(), name='customer-wishlist-create'),
    path('customer/wishlist/<user_id>/', WishlistAPIView.as_view(), name='customer-wishlist'),
    path('customer/notifications/<user_id>/', CustomerNotificationView.as_view(), name='customer-notification'),
    path('customer/notifications/<user_id>/<noti_id>/', MarkNotificationsAsSeen.as_view(), name='customer-notification'),
    path('customer/setting/<int:user_id>/', CustomerUpdateView.as_view(), name='customer-settings'),
    path('customer/wallet/<int:user_id>/', WalletView.as_view(), name='customer-wallet'),
    path('customer/wallet/deposit/<int:user_id>/', DepositView.as_view(), name='customer-wallet-deposit'),
    path('customer/wallet/verify/<int:user_id>/', VerifyPaymentView.as_view(), name='customer-wallet-verify'),
    path('customer/wallet/withdraw/<int:user_id>/', WithdrawView.as_view(), name='customer-wallet-withdraw'),
    ]
