# store/admin.py 
from django.contrib import admin
from store.models import CartOrderItem, CouponUsers, Notification, Product, Tag ,Category
from store.models import Cart, DeliveryCouriers, CartOrder, Gallery, Brand, ProductFaq, Review
from store.models import Specification, Coupon, Color, Size, Address, Wishlist
from store.models.offer import ProductOffer, CategoryOffer, ReferralOffer  # Import the offer models
from import_export.admin import ImportExportModelAdmin
from django import forms
from userauth.models import User
from vendor.models import Vendor

@admin.action(description="Mark selected products as published")
def make_published(modeladmin, request, queryset):
    queryset.update(status="published")

@admin.action(description="Mark selected products as In Review")
def make_in_review(modeladmin, request, queryset):
    queryset.update(status="in_review")
   
@admin.action(description="Mark selected products as Featured")
def make_featured(modeladmin, request, queryset):
    queryset.update(featured=True)
   
class ProductImagesAdmin(admin.TabularInline):
    model = Gallery
   
class SpecificationAdmin(admin.TabularInline):
    model = Specification

class ColorAdmin(admin.TabularInline):
    model = Color

class SizeAdmin(admin.TabularInline):
    model = Size

class CartOrderItemsInlineAdmin(admin.TabularInline):
    model = CartOrderItem

class CouponUsersInlineAdmin(admin.TabularInline):
    model = CouponUsers
   
class ProductAdminForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__'

    vendor = forms.ModelChoiceField(queryset=Vendor.objects.filter(user__is_staff=True))

class ProductAdmin(ImportExportModelAdmin):
    inlines = [ProductImagesAdmin, SpecificationAdmin, ColorAdmin, SizeAdmin]
    search_fields = ['title', 'price', 'slug']
    list_filter = ['featured', 'status', 'in_stock', 'type', 'vendor']
    list_display = [
        'title', 'price', 'in_stock', 'stock_qty',
        'shipping_amount', 'featured', 'status',
        'special_offer', 'hot_deal'
    ]
    list_editable = [
        'price', 'in_stock', 'stock_qty',
        'shipping_amount', 'featured', 'status',
        'special_offer', 'hot_deal'
    ]
    list_display_links = ['title']
    actions = [make_published, make_in_review, make_featured]
    list_per_page = 100
    prepopulated_fields = {"slug": ("title", )}
    form = ProductAdminForm
   
class CartAdmin(ImportExportModelAdmin):
    list_display = ['product', 'cart_id','is_active', 'qty', 'price', 'sub_total' , 'shipping_amount', 'service_fee', 'tax_fee', 'total', 'country', 'size', 'color', 'date']
   
class CategoryAdmin(ImportExportModelAdmin):
    list_editable = [ 'active']
    list_display = ['title', 'thumbnail', 'active']
   
class TagAdmin(ImportExportModelAdmin):
    list_display = ['title', 'category', 'active']
    prepopulated_fields = {"slug": ("title", )}
   
class CartOrderAdmin(ImportExportModelAdmin):
    inlines = [CartOrderItemsInlineAdmin]
    search_fields = ['oid', 'full_name', 'email', 'mobile']
    list_editable = ['order_status', 'payment_status']
    list_filter = ['payment_status', 'order_status']
    list_display = ['oid', 'payment_status', 'order_status', 'sub_total', 'shipping_amount', 'tax_fee', 'service_fee' ,'total', 'saved' ,'date']
   
class CartOrderItemsAdmin(ImportExportModelAdmin):
    list_filter = ['delivery_couriers', 'applied_coupon']
    list_editable = ['date']
    list_display = ['order_id', 'vendor', 'product' ,'qty', 'price', 'sub_total', 'shipping_amount' , 'service_fee', 'tax_fee', 'total' , 'delivery_couriers', 'applied_coupon', 'date']

class BrandAdmin(ImportExportModelAdmin):
    list_editable = [ 'active']
    list_display = ['title', 'brand_image', 'active']
   
class ProductFaqAdmin(ImportExportModelAdmin):
    list_editable = [ 'active', 'answer']
    list_display = ['user', 'question', 'answer' ,'active']
   
class CouponAdmin(ImportExportModelAdmin):
    inlines = [CouponUsersInlineAdmin]
    list_editable = ['code', 'active']
    list_display = ['vendor' ,'code', 'discount', 'active', 'date']
       
class ProductReviewAdmin(ImportExportModelAdmin):
    list_editable = ['active']
    list_display = ['user', 'product', 'review', 'reply' ,'rating', 'active']

class AddressAdmin(ImportExportModelAdmin):
    list_editable = ['status']
    list_display = ['user', 'full_name', 'status']

class DeliveryCouriersAdmin(ImportExportModelAdmin):
    list_editable = ['tracking_website']
    list_display = ['name', 'tracking_website']

class NotificationAdmin(ImportExportModelAdmin):
    list_editable = ['seen']
    list_display = ['order', 'seen', 'user', 'vendor', 'date']

# ==================== OFFER VALIDATION FORMS ====================

class BaseOfferForm(forms.ModelForm):
    def clean_discount_percentage(self):
        discount = self.cleaned_data.get('discount_percentage')
        if discount is not None:
            if discount < 0:
                raise forms.ValidationError("Discount percentage cannot be negative.")
            if discount > 100:
                raise forms.ValidationError("Discount percentage cannot exceed 100%.")
        return discount

class ProductOfferForm(BaseOfferForm):
    class Meta:
        model = ProductOffer
        fields = '__all__'

class CategoryOfferForm(BaseOfferForm):
    class Meta:
        model = CategoryOffer
        fields = '__all__'

# ==================== OFFER ADMIN CLASSES ====================

class ProductOfferAdmin(ImportExportModelAdmin):
    form = ProductOfferForm
    list_display = ['id', 'discount_percentage', 'start_date', 'end_date', 'is_active']
    list_display_links = ['id']  # Make ID clickable to go to detail page
    list_editable = ['discount_percentage', 'is_active']
    list_filter = ['is_active', 'start_date', 'end_date']
    filter_horizontal = ['products']  # For ManyToManyField
    search_fields = ['id']  # Optional: allow searching by ID

class CategoryOfferAdmin(ImportExportModelAdmin):
    form = CategoryOfferForm
    list_display = ['category', 'discount_percentage', 'start_date', 'end_date', 'is_active']
    list_display_links = ['category']  # Click category name to go to offer detail
    list_editable = ['discount_percentage', 'is_active']
    list_filter = ['category', 'is_active', 'start_date', 'end_date']

class ReferralOfferAdmin(ImportExportModelAdmin):
    list_display = ['token', 'referring_user', 'is_used', 'created_at', 'expiry_date']
    list_filter = ['is_used']
    readonly_fields = ['token']

# ==================== REGISTRATIONS ====================

admin.site.register(Review, ProductReviewAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(CartOrder, CartOrderAdmin)
admin.site.register(Cart, CartAdmin)
admin.site.register(CartOrderItem, CartOrderItemsAdmin)
admin.site.register(Brand, BrandAdmin)
admin.site.register(ProductFaq, ProductFaqAdmin)
admin.site.register(Coupon, CouponAdmin)
admin.site.register(Address, AddressAdmin)
admin.site.register(Wishlist)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(DeliveryCouriers, DeliveryCouriersAdmin)

# Register offer models
admin.site.register(ProductOffer, ProductOfferAdmin)
admin.site.register(CategoryOffer, CategoryOfferAdmin)
admin.site.register(ReferralOffer, ReferralOfferAdmin)