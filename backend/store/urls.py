# store/urls.py (Add referral urls)
from django.urls import path
from .views.product_category import CategoryListView, ProductListView, FeaturedProductListView, ProductDetailView
from .views.cart_views import CartAPIView, CartListView, CartDetailView, CartItemDeleteAPIView, CartMergeAPIView
from .views.order_views import CreateOrderView, CheckoutView, CouponAPIView, OrdersDetailAPIView
from .views.checkout_views import RazorpayCheckoutView, PaymentSuccessView
from .views.Review_views import ReviewListAPIView, SearchProductView #, ReviewCreateAPIView
from .views.cancel_views import CancelOrderView, ReturnOrderItemView
from .views.order_management_views import GuestOrderTrackingView
from .views.referral_views import GenerateReferralView, MyReferralCouponsView

urlpatterns = [
    path('category/', CategoryListView.as_view(), name="category"),
    path('products/', ProductListView.as_view(), name= "products"),
    path('featured-products/', FeaturedProductListView.as_view(), name='featured-products'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='brand'),
    path('cart/', CartAPIView.as_view(), name="cart-view"),
    path('cart-list/<str:cart_id>/<int:user_id>/', CartListView.as_view(), name="cart-list-view"),
    path('cart-list/<str:cart_id>/', CartListView.as_view(), name="cart-list-view"),
    #If unauthenticated or registered user places order to handle order this url is used, we don't need
    #new view for it
    path('cart-detail/<str:cart_id>/', CartDetailView.as_view(), name='cart-detail'),
    path('cart-merge/', CartMergeAPIView.as_view(), name="cart-merge"),
   
    ###
    path('cart-delete/<str:cart_id>/<int:item_id>/<int:user_id>/', CartItemDeleteAPIView.as_view(), name="cart-delete"),
    path('cart-delete/<str:cart_id>/<int:item_id>/', CartItemDeleteAPIView.as_view(), name='cart-delete'),
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('checkout/<order_oid>/', CheckoutView.as_view(), name='checkout'),
    path('coupon/', CouponAPIView.as_view(), name='coupon'),
   
    ##-Checkout-views
    path('razorpay-checkout/<str:order_id>/', RazorpayCheckoutView.as_view(), name='razorpay-checkout'),
    path('payment-success/<str:order_id>/', PaymentSuccessView.as_view(), name='payment-success'),
   
    #Reviews
    path('reviews/<product_id>/', ReviewListAPIView.as_view(), name='list-review'),
    # path('reviews/', ReviewCreateAPIView.as_view(), name='create-review'),
    path('search/', SearchProductView.as_view(), name='search'),
   
    #view-order
    path('view-order/<order_id>/', OrdersDetailAPIView.as_view(), name='Order-Detail'),
   
    # Order Management - Cancellation and Returns
    path('cancel-order/', CancelOrderView.as_view(), name='cancel-order'),
    path('return-order-item/', ReturnOrderItemView.as_view(), name='return-order-item'),
   
    # Guest Order Tracking
    path('guest-track-order/', GuestOrderTrackingView.as_view(), name='guest-track-order'),
    
    # Referral
    path('referral/generate/', GenerateReferralView.as_view(), name='generate-referral'),
    path('referral/my-coupons/', MyReferralCouponsView.as_view(), name='my-referral-coupons'),
]