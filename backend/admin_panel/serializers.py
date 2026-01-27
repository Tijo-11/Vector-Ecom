from rest_framework import serializers
from vendor.models import Vendor
from store.models import Product, CartOrder, CategoryOffer
from django.db.models import Count, Sum


class AdminStatsSerializer(serializers.Serializer):
    """Serializer for admin dashboard statistics"""
    total_vendors = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    top_vendor = serializers.CharField()


class MonthlyRevenueSerializer(serializers.Serializer):
    """Serializer for monthly revenue chart data"""
    month = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class MonthlyOrdersSerializer(serializers.Serializer):
    """Serializer for monthly orders chart data"""
    month = serializers.CharField()
    orders = serializers.IntegerField()


class AdminVendorSerializer(serializers.ModelSerializer):
    """Serializer for vendor management"""
    products = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = ['id', 'vid', 'name', 'email', 'products', 'active', 'status', 'date']

    def get_products(self, obj):
        return Product.objects.filter(vendor=obj).count()

    def get_status(self, obj):
        return "Active" if obj.active else "Blocked"


class AdminProductSerializer(serializers.ModelSerializer):
    """Serializer for product management"""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'pid', 'title', 'vendor', 'vendor_name', 'price', 'status', 'status_display', 'in_stock', 'stock_qty', 'date']

    def get_status_display(self, obj):
        return obj.get_status_display() if hasattr(obj, 'get_status_display') else obj.status


class AdminOrderSerializer(serializers.ModelSerializer):
    """Serializer for order management"""
    vendor_names = serializers.SerializerMethodField()

    class Meta:
        model = CartOrder
        fields = ['id', 'oid', 'vendor_names', 'full_name', 'total', 'payment_status', 'order_status', 'date']

    def get_vendor_names(self, obj):
        return ", ".join([v.name for v in obj.vendor.all()])


class AdminCategoryOfferSerializer(serializers.ModelSerializer):
    """Serializer for category offer management"""
    category_name = serializers.CharField(source='category.title', read_only=True)

    class Meta:
        model = CategoryOffer
        fields = ['id', 'category', 'category_name', 'discount_percentage', 'start_date', 'end_date', 'is_active']


class SalesReportSerializer(serializers.Serializer):
    """Serializer for sales report"""
    total_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()


class VendorPerformanceSerializer(serializers.Serializer):
    """Serializer for vendor performance report"""
    vendor_id = serializers.IntegerField()
    vendor_name = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    total_products = serializers.IntegerField()


class ProductReportSerializer(serializers.Serializer):
    """Serializer for product report"""
    product_id = serializers.IntegerField()
    product_title = serializers.CharField()
    vendor_name = serializers.CharField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
