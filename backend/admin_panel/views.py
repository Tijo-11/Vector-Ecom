from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from django.utils import timezone

from vendor.models import Vendor
from store.models import Product, CartOrder, CartOrderItem, CategoryOffer, Notification
from store.serializers import NotificationSerializer
from addon.models import ConfigSettings
from addon.serializers import ConfigSettingsSerializer
from .serializers import (
    AdminStatsSerializer, MonthlyRevenueSerializer, MonthlyOrdersSerializer,
    AdminVendorSerializer, AdminProductSerializer, AdminOrderSerializer,
    AdminCategoryOfferSerializer, SalesReportSerializer,
    VendorPerformanceSerializer, ProductReportSerializer
)
from .permissions import IsAdminUser


class AdminStatsAPIView(APIView):
    """
    GET: Returns dashboard statistics for admin panel
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Total vendors
        total_vendors = Vendor.objects.filter(active=True).count()

        # Total orders (paid orders only)
        total_orders = CartOrder.objects.filter(payment_status='paid').count()

        # Total revenue (sum of all paid orders)
        total_revenue = CartOrder.objects.filter(
            payment_status='paid'
        ).aggregate(total=Sum('total'))['total'] or 0

        # Top vendor by revenue
        top_vendor_data = CartOrder.objects.filter(
            payment_status='paid'
        ).values('vendor__name').annotate(
            revenue=Sum('total')
        ).order_by('-revenue').first()

        top_vendor = top_vendor_data['vendor__name'] if top_vendor_data else "N/A"

        data = {
            'total_vendors': total_vendors,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'top_vendor': top_vendor
        }

        serializer = AdminStatsSerializer(data)
        return Response([serializer.data], status=status.HTTP_200_OK)


class AdminRevenueChartAPIView(APIView):
    """
    GET: Returns monthly revenue data for the past 12 months
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Get data from the past 12 months
        twelve_months_ago = timezone.now() - timedelta(days=365)

        monthly_revenue = CartOrder.objects.filter(
            payment_status='paid',
            date__gte=twelve_months_ago
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            revenue=Sum('total')
        ).order_by('month')

        # Format the data
        chart_data = []
        for item in monthly_revenue:
            chart_data.append({
                'month': item['month'].strftime('%Y-%m-%d'),
                'revenue': float(item['revenue'])
            })

        serializer = MonthlyRevenueSerializer(chart_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminOrdersChartAPIView(APIView):
    """
    GET: Returns monthly order counts for the past 12 months
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Get data from the past 12 months
        twelve_months_ago = timezone.now() - timedelta(days=365)

        monthly_orders = CartOrder.objects.filter(
            payment_status='paid',
            date__gte=twelve_months_ago
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            orders=Count('id')
        ).order_by('month')

        # Format the data
        chart_data = []
        for item in monthly_orders:
            chart_data.append({
                'month': item['month'].strftime('%Y-%m-%d'),
                'orders': item['orders']
            })

        serializer = MonthlyOrdersSerializer(chart_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminVendorListAPIView(generics.ListAPIView):
    """
    GET: List all vendors with product counts
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminVendorSerializer
    queryset = Vendor.objects.all().order_by('-date')


class AdminVendorToggleAPIView(APIView):
    """
    PATCH: Toggle vendor active status (block/unblock)
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id)
            vendor.active = not vendor.active
            vendor.save()

            serializer = AdminVendorSerializer(vendor)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminProductListAPIView(generics.ListAPIView):
    """
    GET: List all products with vendor information
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminProductSerializer
    queryset = Product.objects.all().select_related('vendor').order_by('-date')


class AdminProductToggleAPIView(APIView):
    """
    PATCH: Toggle product status (activate/deactivate)
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
            # Toggle between 'published' and 'disabled'
            if product.status == 'published':
                product.status = 'disabled'
            else:
                product.status = 'published'
            product.save()

            serializer = AdminProductSerializer(product)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminOrderListAPIView(generics.ListAPIView):
    """
    GET: List all orders
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    queryset = CartOrder.objects.all().prefetch_related('vendor').order_by('-date')


class AdminOrderDetailAPIView(generics.RetrieveAPIView):
    """
    GET: Get order details by OID
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    queryset = CartOrder.objects.all().prefetch_related('vendor', 'orderitem')
    lookup_field = 'oid'


class AdminCategoryOfferListCreateAPIView(generics.ListCreateAPIView):
    """
    GET: List all category offers
    POST: Create new category offer
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategoryOfferSerializer
    queryset = CategoryOffer.objects.all().select_related('category').order_by('-start_date')


class AdminCategoryOfferDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve category offer
    PATCH/PUT: Update category offer
    DELETE: Delete category offer
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategoryOfferSerializer
    queryset = CategoryOffer.objects.all().select_related('category')


class AdminReportsAPIView(APIView):
    """
    GET: Returns various reports (sales, vendor performance, products)
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        report_type = request.query_params.get('type', 'sales')

        if report_type == 'sales':
            return self.get_sales_report()
        elif report_type == 'vendor_performance':
            return self.get_vendor_performance()
        elif report_type == 'products':
            return self.get_product_report()
        else:
            return Response(
                {'error': 'Invalid report type'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_sales_report(self):
        """Generate sales report"""
        total_sales = CartOrder.objects.filter(
            payment_status='paid'
        ).aggregate(total=Sum('total'))['total'] or 0

        total_orders = CartOrder.objects.filter(payment_status='paid').count()
        pending_orders = CartOrder.objects.filter(order_status='Pending').count()
        delivered_orders = CartOrder.objects.filter(order_status='Delivered').count()
        
        # Count cancelled orders
        cancelled_orders = CartOrder.objects.filter(
            Q(payment_status='cancelled') | Q(order_status='Cancelled')
        ).count()

        data = {
            'total_sales': total_sales,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'delivered_orders': delivered_orders,
            'cancelled_orders': cancelled_orders
        }

        serializer = SalesReportSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_vendor_performance(self):
        """Generate vendor performance report"""
        vendors = Vendor.objects.annotate(
            total_revenue=Sum(
                'cartorder__total',
                filter=Q(cartorder__payment_status='paid')
            ),
            total_orders=Count(
                'cartorder',
                filter=Q(cartorder__payment_status='paid')
            ),
            total_products=Count('vendor')
        ).order_by('-total_revenue')[:10]

        data = []
        for vendor in vendors:
            data.append({
                'vendor_id': vendor.id,
                'vendor_name': vendor.name,
                'total_revenue': vendor.total_revenue or 0,
                'total_orders': vendor.total_orders or 0,
                'total_products': vendor.total_products or 0
            })

        serializer = VendorPerformanceSerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_product_report(self):
        """Generate product report"""
        products = Product.objects.annotate(
            total_orders=Count(
                'order_item',
                filter=Q(order_item__order__payment_status='paid')
            ),
            total_revenue=Sum(
                'order_item__total',
                filter=Q(order_item__order__payment_status='paid')
            )
        ).select_related('vendor').order_by('-total_orders')[:20]

        data = []
        for product in products:
            data.append({
                'product_id': product.id,
                'product_title': product.title,
                'vendor_name': product.vendor.name if product.vendor else 'N/A',
                'total_orders': product.total_orders or 0,
                'total_revenue': product.total_revenue or 0
            })

        serializer = ProductReportSerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminNotificationListAPIView(generics.ListAPIView):
    """
    GET: List all admin notifications
    """
    permission_classes = [IsAdminUser]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        # Get notifications for admin users
        return Notification.objects.filter(
            user__is_staff=True
        ).order_by('-date')


class AdminNotificationMarkReadAPIView(APIView):
    """
    PATCH: Mark notification as read
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.seen = True
            notification.save()
            return Response(
                {'message': 'Notification marked as read'},
                status=status.HTTP_200_OK
            )
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminSettingsAPIView(APIView):
    """
    GET: Retrieve admin settings
    PATCH: Update admin settings
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            settings = ConfigSettings.objects.first()
            if not settings:
                settings = ConfigSettings.objects.create()
            serializer = ConfigSettingsSerializer(settings)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        try:
            settings = ConfigSettings.objects.first()
            if not settings:
                settings = ConfigSettings.objects.create()
            
            # Update settings based on request data
            for key, value in request.data.items():
                if hasattr(settings, key):
                    setattr(settings, key, value)
            settings.save()

            serializer = ConfigSettingsSerializer(settings)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
