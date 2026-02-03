from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('stats/', views.AdminStatsAPIView.as_view(), name='admin-stats'),
    path('revenue-chart/', views.AdminRevenueChartAPIView.as_view(), name='admin-revenue-chart'),
    path('orders-chart/', views.AdminOrdersChartAPIView.as_view(), name='admin-orders-chart'),
    path('best-selling-products/', views.BestSellingProductsAPIView.as_view(), name='admin-best-selling-products'),
    path('best-selling-categories/', views.BestSellingCategoriesAPIView.as_view(), name='admin-best-selling-categories'),

    # Vendor Management
    path('vendors/', views.AdminVendorListAPIView.as_view(), name='admin-vendors-list'),
    path('vendors/<int:vendor_id>/toggle/', views.AdminVendorToggleAPIView.as_view(), name='admin-vendor-toggle'),

    # Product Management
    path('products/', views.AdminProductListAPIView.as_view(), name='admin-products-list'),
    path('products/<int:product_id>/toggle/', views.AdminProductToggleAPIView.as_view(), name='admin-product-toggle'),

    # Order Management
    path('orders/', views.AdminOrderListAPIView.as_view(), name='admin-orders-list'),
    path('orders/<str:oid>/', views.AdminOrderDetailAPIView.as_view(), name='admin-order-detail'),

    # Category Offers
    path('category-offers/', views.AdminCategoryOfferListCreateAPIView.as_view(), name='admin-category-offers'),
    path('category-offers/<int:pk>/', views.AdminCategoryOfferDetailAPIView.as_view(), name='admin-category-offer-detail'),

    # Reports
    path('reports/', views.AdminReportsAPIView.as_view(), name='admin-reports'),

    # Notifications
    path('notifications/', views.AdminNotificationListAPIView.as_view(), name='admin-notifications'),
    path('notifications/<int:notification_id>/mark-read/', views.AdminNotificationMarkReadAPIView.as_view(), name='admin-notification-mark-read'),

    # Settings
    path('settings/', views.AdminSettingsAPIView.as_view(), name='admin-settings'),
]

