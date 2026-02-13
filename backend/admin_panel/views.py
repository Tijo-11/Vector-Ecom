from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth, TruncDay, TruncWeek, TruncYear
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination

from vendor.models import Vendor
from store.models import Product, CartOrder, CartOrderItem, CategoryOffer, Notification
from store.serializers import NotificationSerializer
from addon.models import ConfigSettings
from addon.serializers import ConfigSettingsSerializer
from .serializers import (
    AdminStatsSerializer, ChartRevenueSerializer, ChartOrdersSerializer,
    AdminVendorSerializer, AdminProductSerializer, AdminOrderSerializer,
    AdminCategoryOfferSerializer, SalesReportSerializer,
    VendorPerformanceSerializer, ProductReportSerializer,
    BestSellingProductSerializer, BestSellingCategorySerializer
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
    GET: Returns revenue data based on period filter
    Query params: ?period=daily|weekly|monthly|yearly (default: monthly)
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'monthly')
        
        # Calculate date range and truncation based on period
        now = timezone.now()
        if period == 'daily':
            start_date = now - timedelta(days=30)
            trunc_func = TruncDay
        elif period == 'weekly':
            start_date = now - timedelta(weeks=12)
            trunc_func = TruncWeek
        elif period == 'yearly':
            start_date = now - timedelta(days=365*3)
            trunc_func = TruncYear
        else:  # monthly (default)
            start_date = now - timedelta(days=365)
            trunc_func = TruncMonth

        revenue_data = CartOrder.objects.filter(
            payment_status='paid',
            date__gte=start_date
        ).annotate(
            period_date=trunc_func('date')
        ).values('period_date').annotate(
            revenue=Sum('total')
        ).order_by('period_date')

        # Format the data
        chart_data = []
        for item in revenue_data:
            chart_data.append({
                'date': item['period_date'].strftime('%Y-%m-%d'),
                'revenue': float(item['revenue'])
            })

        serializer = ChartRevenueSerializer(chart_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminOrdersChartAPIView(APIView):
    """
    GET: Returns order counts based on period filter
    Query params: ?period=daily|weekly|monthly|yearly (default: monthly)
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'monthly')
        
        # Calculate date range and truncation based on period
        now = timezone.now()
        if period == 'daily':
            start_date = now - timedelta(days=30)
            trunc_func = TruncDay
        elif period == 'weekly':
            start_date = now - timedelta(weeks=12)
            trunc_func = TruncWeek
        elif period == 'yearly':
            start_date = now - timedelta(days=365*3)
            trunc_func = TruncYear
        else:  # monthly (default)
            start_date = now - timedelta(days=365)
            trunc_func = TruncMonth

        orders_data = CartOrder.objects.filter(
            payment_status='paid',
            date__gte=start_date
        ).annotate(
            period_date=trunc_func('date')
        ).values('period_date').annotate(
            orders=Count('id')
        ).order_by('period_date')

        # Format the data
        chart_data = []
        for item in orders_data:
            chart_data.append({
                'date': item['period_date'].strftime('%Y-%m-%d'),
                'orders': item['orders']
            })

        serializer = ChartOrdersSerializer(chart_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminVendorListAPIView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminVendorSerializer
    queryset = Vendor.objects.all().order_by('-date')
    pagination_class = PageNumberPagination


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
        # Aggregate directly on CartOrderItem to avoid Cartesian product duplicates
        vendor_performance = CartOrderItem.objects.filter(
            order__payment_status='paid',
            vendor__isnull=False
        ).values(
            'vendor__id', 'vendor__name'
        ).annotate(
            total_revenue=Sum('total'),
            total_orders=Count('order', distinct=True)
        ).order_by('-total_revenue')[:10]

        data = []
        for item in vendor_performance:
            vendor_id = item['vendor__id']
            # Fetch product count separately
            total_products = Product.objects.filter(vendor_id=vendor_id).count()
            
            data.append({
                'vendor_id': vendor_id,
                'vendor_name': item['vendor__name'], # Note: vendor__name might need to be vendor__name (from values)
                'total_revenue': item['total_revenue'] or 0,
                'total_orders': item['total_orders'] or 0,
                'total_products': total_products
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


class BestSellingProductsAPIView(APIView):
    """
    GET: Returns top 10 best selling products by quantity sold
    Query params: ?period=daily|weekly|monthly|yearly (default: monthly)
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'monthly')
        
        # Calculate date range based on period
        now = timezone.now()
        if period == 'daily':
            start_date = now - timedelta(days=30)
        elif period == 'weekly':
            start_date = now - timedelta(weeks=12)
        elif period == 'yearly':
            start_date = now - timedelta(days=365*3)
        else:  # monthly (default)
            start_date = now - timedelta(days=365)

        # Get products with their sell count
        best_products = CartOrderItem.objects.filter(
            order__payment_status='paid',
            order__date__gte=start_date
        ).values(
            'product__id', 'product__title', 'product__image',
            'product__vendor__name', 'product__category__title', 'product__price'
        ).annotate(
            sell_count=Sum('qty')
        ).order_by('-sell_count')[:10]

        data = []
        for item in best_products:
            # Build absolute image URL
            image_url = None
            if item['product__image']:
                image_url = request.build_absolute_uri('/media/' + str(item['product__image']))
            
            data.append({
                'id': item['product__id'],
                'title': item['product__title'],
                'image': image_url,
                'vendor_name': item['product__vendor__name'] or 'N/A',
                'category_name': item['product__category__title'] or 'N/A',
                'price': item['product__price'] or 0,
                'sell_count': item['sell_count'] or 0
            })

        serializer = BestSellingProductSerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BestSellingCategoriesAPIView(APIView):
    """
    GET: Returns top 10 best selling categories by quantity sold
    Query params: ?period=daily|weekly|monthly|yearly (default: monthly)
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'monthly')
        
        # Calculate date range based on period
        now = timezone.now()
        if period == 'daily':
            start_date = now - timedelta(days=30)
        elif period == 'weekly':
            start_date = now - timedelta(weeks=12)
        elif period == 'yearly':
            start_date = now - timedelta(days=365*3)
        else:  # monthly (default)
            start_date = now - timedelta(days=365)

        # Get categories with their sell count
        best_categories = CartOrderItem.objects.filter(
            order__payment_status='paid',
            order__date__gte=start_date,
            product__category__isnull=False
        ).values(
            'product__category__id', 'product__category__title', 'product__category__image'
        ).annotate(
            sell_count=Sum('qty')
        ).order_by('-sell_count')[:10]

        data = []
        for item in best_categories:
            # Build absolute image URL
            image_url = None
            if item['product__category__image']:
                image_url = request.build_absolute_uri('/media/' + str(item['product__category__image']))
            
            data.append({
                'id': item['product__category__id'],
                'title': item['product__category__title'],
                'image': image_url,
                'sell_count': item['sell_count'] or 0
            })

        serializer = BestSellingCategorySerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

