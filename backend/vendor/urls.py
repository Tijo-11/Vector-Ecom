from django.urls import path
from .views.dashboard_views import DashboardStatsAPIView, MonthlyOrderChartAPIFBV, MonthlyProductsChartAPIFBV
from .views.dashboard_views import ProductsAPIView, OrdersAPIView, RevenueAPIView, OrderDetailAPIView
urlpatterns=[
    path('vendor/stats/<vendor_id>/', DashboardStatsAPIView.as_view(), name='vendor-stats'),
    path('vendor/products/<vendor_id>/', ProductsAPIView.as_view(), name='vendor-prdoucts'),
    path('vendor/revenue/<vendor_id>/', RevenueAPIView.as_view(), name='vendor-prdoucts'),
    path('vendor/orders/<vendor_id>/', OrdersAPIView.as_view(), name='vendor-orders'),
    path('vendor/orders/<vendor_id>/<order_oid>/', OrderDetailAPIView.as_view(), name='vendor-order-detail'),
    # path('vendor/yearly-report/<vendor_id>/', vendor_views.YearlyOrderReportChartAPIView.as_view(), name='vendor-yearly-report'),
    path('vendor-orders-report-chart/<vendor_id>/', MonthlyOrderChartAPIFBV, name='vendor-orders-report-chart'),
    path('vendor-products-report-chart/<vendor_id>/', MonthlyProductsChartAPIFBV, name='vendor-product-report-chart'),
    # path('vendor-product-create/<vendor_id>/', vendor_views.ProductCreateView.as_view(), name='vendor-product-create'),
    # path('vendor-product-edit/<vendor_id>/<product_pid>/', vendor_views.ProductUpdateAPIView.as_view(), name='vendor-product-edit'),
    # path('vendor-product-delete/<vendor_id>/<product_pid>/', vendor_views.ProductDeleteAPIView.as_view(), name='vendor-product-delete'),
    # path('vendor-product-filter/<vendor_id>', vendor_views.FilterProductsAPIView.as_view(), name='vendor-product-filter'),
    # path('vendor-earning/<vendor_id>/', vendor_views.Earning.as_view(), name='vendor-product-filter'),
    # path('vendor-monthly-earning/<vendor_id>/', vendor_views.MonthlyEarningTracker, name='vendor-product-filter'),
    # path('vendor-reviews/<vendor_id>/', vendor_views.ReviewsListAPIView.as_view(), name='vendor-reviews'),
    # path('vendor-reviews/<vendor_id>/<review_id>/', vendor_views.ReviewsDetailAPIView.as_view(), name='vendor-review-detail'),
    # path('vendor-coupon-list/<vendor_id>/', vendor_views.CouponListAPIView.as_view(), name='vendor-coupon-list'),
    # path('vendor-coupon-stats/<vendor_id>/', vendor_views.CouponStats.as_view(), name='vendor-coupon-stats'),
    # path('vendor-coupon-detail/<vendor_id>/<coupon_id>/', vendor_views.CouponDetailAPIView.as_view(), name='vendor-coupon-detail'),
    # path('vendor-coupon-create/<vendor_id>/', vendor_views.CouponCreateAPIView.as_view(), name='vendor-coupon-create'),
    # path('vendor-notifications-unseen/<vendor_id>/', vendor_views.NotificationUnSeenListAPIView.as_view(), name='vendor-notifications-list'),
    # path('vendor-notifications-seen/<vendor_id>/', vendor_views.NotificationSeenListAPIView.as_view(), name='vendor-notifications-list'),
    # path('vendor-notifications-summary/<vendor_id>/', vendor_views.NotificationSummaryAPIView.as_view(), name='vendor-notifications-summary'),
    # path('vendor-notifications-mark-as-seen/<vendor_id>/<noti_id>/', vendor_views.NotificationMarkAsSeen.as_view(), name='vendor-notifications-mark-as-seen'),
    # path('vendor-settings/<int:pk>/', vendor_views.VendorProfileUpdateView.as_view(), name='vendor-settings'),
    # path('vendor-shop-settings/<int:pk>/', vendor_views.ShopUpdateView.as_view(), name='customer-settings'),
    # path('shop/<vendor_slug>/', vendor_views.ShopAPIView.as_view(), name='shop'),
    # path('vendor-products/<vendor_slug>/', vendor_views.ShopProductsAPIView.as_view(), name='vendor-products'),
    # path('vendor-register/', vendor_views.VendorRegister.as_view(), name='vendor-register'),
]
    # # Tracking Feature
    # path('vendor/couriers/', vendor_views.CourierListAPIView.as_view()),
    # path('vendor/order-item-detail/<int:pk>/', vendor_views.OrderItemDetailAPIView.as_view()),

    