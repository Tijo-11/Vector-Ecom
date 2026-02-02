# store/urls.py
from django.urls import path
from .views.product_category import CategoryListView, ProductListView, FeaturedProductListView, ProductDetailView
from .views.cart_views import CartAPIView, CartListView, CartDetailView, CartItemDeleteAPIView, CartMergeAPIView
from .views.order_views import (
    CreateOrderView, CheckoutView, CouponAPIView, OrdersDetailAPIView,
    RemoveCouponAPIView, CODOrderConfirmView  # <-- Added COD view
)
from .views.checkout_views import RazorpayCheckoutView, PaymentSuccessView, WalletPaymentView
from .views.Review_views import ReviewListAPIView, SearchProductView, HasPurchasedView, ReviewDetailAPIView
from .views.cancel_views import CancelOrderView, ReturnOrderItemView
from .views.order_management_views import GuestOrderTrackingView
from .views.referral_views import GenerateReferralView, ApplyReferralView, MyReferralCouponsView

urlpatterns = [
    path('category/', CategoryListView.as_view(), name="category"),
    path('products/', ProductListView.as_view(), name="products"),
    path('featured-products/', FeaturedProductListView.as_view(), name='featured-products'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='brand'),
    path('cart/', CartAPIView.as_view(), name="cart-view"),
    path('cart-list/<str:cart_id>/<int:user_id>/', CartListView.as_view(), name="cart-list-view"),
    path('cart-list/<str:cart_id>/', CartListView.as_view(), name="cart-list-view"),
    path('cart-detail/<str:cart_id>/', CartDetailView.as_view(), name='cart-detail'),
    path('cart-merge/', CartMergeAPIView.as_view(), name="cart-merge"),
    path('cart-delete/<str:cart_id>/<int:item_id>/<int:user_id>/', CartItemDeleteAPIView.as_view(), name="cart-delete"),
    path('cart-delete/<str:cart_id>/<int:item_id>/', CartItemDeleteAPIView.as_view(), name='cart-delete'),
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('checkout/<str:order_oid>/', CheckoutView.as_view(), name='checkout'),  # <-- Uses CheckoutView from order_views
    path('coupon/', CouponAPIView.as_view(), name='coupon'),

    # Checkout views (Razorpay & Payment Success)
    path('razorpay-checkout/<str:order_id>/', RazorpayCheckoutView.as_view(), name='razorpay-checkout'),
    path('payment-success/<str:order_id>/', PaymentSuccessView.as_view(), name='payment-success'),

    # Reviews
    path('reviews/product/<int:product_id>/', ReviewListAPIView.as_view(), name='list-review'),
    path('reviews/<int:pk>/', ReviewDetailAPIView.as_view(), name='review-detail'),
    path('product/<int:product_id>/has-purchased/', HasPurchasedView.as_view(), name='has-purchased'),
    path('search/', SearchProductView.as_view(), name='search'),

    # View order
    path('view-order/<order_id>/', OrdersDetailAPIView.as_view(), name='Order-Detail'),

    # Order Management
    path('cancel-order/', CancelOrderView.as_view(), name='cancel-order'),
    path('return-order-item/', ReturnOrderItemView.as_view(), name='return-order-item'),

    # Guest Order Tracking
    path('guest-track-order/', GuestOrderTrackingView.as_view(), name='guest-track-order'),

    # Referral System
    path('referral/generate/', GenerateReferralView.as_view(), name='generate-referral'),
    path('referral/apply/', ApplyReferralView.as_view(), name='apply-referral'),
    path('referral/my-coupons/', MyReferralCouponsView.as_view(), name='my-referral-coupons'),

    # Remove coupon
    path('coupon/remove/', RemoveCouponAPIView.as_view(), name='remove-coupon'),

    # Cash on Delivery confirmation
    path('cod-confirm/', CODOrderConfirmView.as_view(), name='cod-confirm'),

    # Wallet payment
    path('wallet-payment/', WalletPaymentView.as_view(), name='wallet-payment'),
]