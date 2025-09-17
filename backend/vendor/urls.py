from django.urls import path
from .views.dashboard_views import DashboardStatsAPIView, MonthlyOrderChartAPIFBV, MonthlyProductsChartAPIFBV
from .views.dashboard_views import ProductsAPIView, OrdersAPIView, RevenueAPIView, OrderDetailAPIView, FilterOrderAPIView
from .views.dashboard_views import Earning, MonthlyEarningTracker, ReviewsListAPIView, ReviewsDetailAPIView, YearlyOrderReportChartAPIView
from .views.coupon_views import CouponListAPIView, CouponStats, CouponDetailAPIView, CouponCreateAPIView
#dashboard view contains yearly revenue
from .views.notification_views import *
from .views.shop_views import * #Both Vendor, Shop and Courier
from .views.product_views import *#create, delete, update
urlpatterns=[
    path('vendor/stats/<vendor_id>/', DashboardStatsAPIView.as_view(), name='vendor-stats'),
    path('vendor/products/<vendor_id>/', ProductsAPIView.as_view(), name='vendor-prdoucts'),
    path('vendor/revenue/<vendor_id>/', RevenueAPIView.as_view(), name='vendor-prdoucts'),
    path('vendor/orders/<vendor_id>/', OrdersAPIView.as_view(), name='vendor-orders'),
    path('vendor/orders/<vendor_id>/<order_oid>/', OrderDetailAPIView.as_view(), name='vendor-order-detail'),
    path('vendor/order-item-detail/<int:pk>/', OrderItemDetailAPIView.as_view()),
    path('vendor/orders-filter/<vendor_id>/', FilterOrderAPIView.as_view()),
    ###

    path('vendor/yearly-report/<vendor_id>/', YearlyOrderReportChartAPIView.as_view(), name='vendor-yearly-report'),
    path('vendor-orders-report-chart/<vendor_id>/', MonthlyOrderChartAPIFBV, name='vendor-orders-report-chart'),
    ####
    path('vendor-products-report-chart/<vendor_id>/', MonthlyProductsChartAPIFBV, name='vendor-product-report-chart'),
    path('vendor-product-create/<vendor_id>/', ProductCreateView.as_view(), name='vendor-product-create'),
    path('vendor-product-edit/<vendor_id>/<product_pid>/', ProductUpdateAPIView.as_view(), name='vendor-product-edit'),
    path('vendor-product-delete/<vendor_id>/<product_pid>/', ProductDeleteAPIView.as_view(), name='vendor-product-delete'),
    path('vendor-product-filter/<vendor_id>', FilterProductsAPIView.as_view(), name='vendor-product-filter'),
    ###
    path('vendor-earning/<vendor_id>/', Earning.as_view(), name='vendor-product-filter'),
    path('vendor-monthly-earning/<vendor_id>/', MonthlyEarningTracker, name='vendor-product-filter'),
    path('vendor-reviews/<vendor_id>/', ReviewsListAPIView.as_view(), name='vendor-reviews'),
    path('vendor-reviews/<vendor_id>/<review_id>/', ReviewsDetailAPIView.as_view(), name='vendor-review-detail'),
    path('vendor-coupon-list/<vendor_id>/', CouponListAPIView.as_view(), name='vendor-coupon-list'),
    path('vendor-coupon-stats/<vendor_id>/', CouponStats.as_view(), name='vendor-coupon-stats'),
    path('vendor-coupon-detail/<vendor_id>/<coupon_id>/', CouponDetailAPIView.as_view(), name='vendor-coupon-detail'),
    path('vendor-coupon-create/<vendor_id>/', CouponCreateAPIView.as_view(), name='vendor-coupon-create'),
    path('vendor-notifications-unseen/<vendor_id>/', NotificationUnSeenListAPIView.as_view(), name='vendor-notifications-list'),
    path('vendor-notifications-seen/<vendor_id>/', NotificationSeenListAPIView.as_view(), name='vendor-notifications-list'),
    path('vendor-notifications-summary/<vendor_id>/', NotificationSummaryAPIView.as_view(), name='vendor-notifications-summary'),
    path('vendor-notifications-mark-as-seen/<vendor_id>/<noti_id>/', NotificationMarkAsSeen.as_view(), name='vendor-notifications-mark-as-seen'),
    path('vendor-settings/<int:pk>/', VendorProfileUpdateView.as_view(), name='vendor-settings'),
    path('vendor-shop-settings/<int:pk>/', ShopUpdateView.as_view(), name='customer-settings'),
    path('shop/<vendor_slug>/', ShopAPIView.as_view(), name='shop'),
    path('vendor-products/<vendor_slug>/', ShopProductsAPIView.as_view(), name='vendor-products'),
    path('vendor-register/', VendorRegister.as_view(), name='vendor-register'),
     # # Tracking Feature
    path('vendor/couriers/', CourierListAPIView.as_view()),

]
   

    