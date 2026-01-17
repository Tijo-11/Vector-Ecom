# store/serializers.py 

from rest_framework import serializers
from store.models import (
    CancelledOrder, Cart, CartOrderItem, Notification, CouponUsers,
    Product, Tag, Category, DeliveryCouriers, CartOrder, Gallery,
    Brand, ProductFaq, Review, Specification, Coupon, Color, Size,
    Address, Wishlist, OrderCancellation, OrderReturn, ProductOffer,
    CategoryOffer, ReferralOffer
)
from addon.models import ConfigSettings
from userauth.serializers import ProfileSerializer
from django.utils import timezone
from django.db.models import Max, Q

class ConfigSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigSettings
        fields = "__all__"

class CategorySerializer(serializers.ModelSerializer):
    offer_discount = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_offer_discount(self, obj):
        now = timezone.now()
        # Filter offers that have started and have not ended (or no end date)
        offers = obj.category_offers.filter(
            start_date__lte=now
        ).filter(
            Q(end_date__gte=now) | Q(end_date__isnull=True)
        )
        if offers.exists():
            return offers.aggregate(Max('discount_percentage'))['discount_percentage__max'] or 0
        return 0

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class GallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Gallery
        fields = '__all__'

class SpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specification
        fields = '__all__'

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = '__all__'

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    gallery = GallerySerializer(many=True, read_only=True, required=False)
    color = ColorSerializer(many=True, read_only=True, required=False)
    size = SizeSerializer(many=True, read_only=True, required=False)
    specification = SpecificationSerializer(many=True, read_only=True, required=False)
    rating = serializers.IntegerField(required=False)
    product_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    order_count = serializers.SerializerMethodField()
    offer_discount = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "image",
            "description",
            "category",
            "tags",
            "brand",
            "price",
            "shipping_amount",
            "stock_qty",
            "in_stock",
            "status",
            "type",
            "featured",
            "hot_deal",
            "special_offer",
            "digital",
            "views",
            "orders",
            "saved",
            "rating",
            "vendor",
            "sku",
            "pid",
            "slug",
            "date",
            "gallery",
            "specification",
            "size",
            "color",
            "product_rating",
            "rating_count",
            "order_count",
            "stock_qty",
            "offer_discount"
        ]

    def get_product_rating(self, obj):
        return obj.product_rating()

    def get_rating_count(self, obj):
        return obj.rating_count()

    def get_order_count(self, obj):
        return obj.order_count()

    def get_offer_discount(self, obj):
        now = timezone.now()

        # Product-specific offers (include vendor-specific or global)
        product_discount = 0
        grace_period = timezone.now() + timezone.timedelta(minutes=1)
        product_offers = obj.product_offers.filter(
            start_date__lte=grace_period
        ).filter(
            Q(end_date__gte=now) | Q(end_date__isnull=True)
        ).filter(
            Q(vendor=obj.vendor) | Q(vendor__isnull=True)
        )
        if product_offers.exists():
            product_discount = product_offers.aggregate(
                Max('discount_percentage')
            )['discount_percentage__max'] or 0

        # Category offers
        category_discount = 0
        if obj.category:
            category_offers = obj.category.category_offers.filter(
                start_date__lte=grace_period
            ).filter(
                Q(end_date__gte=now) | Q(end_date__isnull=True)
            )
            if category_offers.exists():
                category_discount = category_offers.aggregate(
                    Max('discount_percentage')
                )['discount_percentage__max'] or 0

        # Return the highest applicable discount
        return max(product_discount, category_discount)

    def __init__(self, *args, **kwargs):
        super(ProductSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class ProductFaqSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = ProductFaq
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(ProductFaqSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CartSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = Cart
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(CartSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CartOrderItemSerializer(serializers.ModelSerializer):
    is_cancelled = serializers.SerializerMethodField()

    class Meta:
        model = CartOrderItem
        fields = '__all__'

    def get_is_cancelled(self, obj):
        from store.models import OrderCancellation
        return OrderCancellation.objects.filter(items=obj).exists()

    def __init__(self, *args, **kwargs):
        super(CartOrderItemSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CartOrderSerializer(serializers.ModelSerializer):
    orderitem = CartOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = CartOrder
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(CartOrderSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class ReviewSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    profile = ProfileSerializer()

    class Meta:
        model = Review
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(ReviewSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = Wishlist
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(WishlistSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(AddressSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CancelledOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = CancelledOrder
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(CancelledOrderSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(CouponSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CouponUsersSerializer(serializers.ModelSerializer):
    coupon = CouponSerializer()

    class Meta:
        model = CouponUsers
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(CouponUsersSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class DeliveryCouriersSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryCouriers
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(NotificationSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class SummarySerializer(serializers.Serializer):
    products = serializers.IntegerField()
    orders = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)

class EarningSummarySerializer(serializers.Serializer):
    monthly_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)

class CouponSummarySerializer(serializers.Serializer):
    total_coupons = serializers.IntegerField(default=0)
    active_coupons = serializers.IntegerField(default=0)

class NotificationSummarySerializer(serializers.Serializer):
    un_read_noti = serializers.IntegerField(default=0)
    read_noti = serializers.IntegerField(default=0)
    all_noti = serializers.IntegerField(default=0)

class OrderCancellationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderCancellation
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(OrderCancellationSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class OrderReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderReturn
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(OrderReturnSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class ProductOfferSerializer(serializers.ModelSerializer):
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    start_date = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = ProductOffer
        fields = ['id', 'discount_percentage', 'start_date', 'end_date', 'is_active', 'products', 'product_ids']
        read_only_fields = ['products']

class CategoryOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryOffer
        fields = ['id', 'discount_percentage', 'start_date', 'end_date', 'category']

    def __init__(self, *args, **kwargs):
        super(CategoryOfferSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class ReferralOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralOffer
        fields = ['id', 'token', 'created_at', 'is_used', 'expiry_date', 'referring_user', 'reward_coupon']

    def __init__(self, *args, **kwargs):
        super(ReferralOfferSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3