# store/admin.py 
from django.contrib import admin
from store.models import CartOrderItem, CouponUsers, Notification, Product, Tag ,Category
from store.models import Cart, DeliveryCouriers, CartOrder, Gallery, Brand, ProductFaq, Review
from store.models import Specification, Coupon, Color, Size, Address, Wishlist
from store.models.offer import ProductOffer, CategoryOffer, ReferralOffer  # Import the offer models
from import_export.admin import ImportExportModelAdmin#ImportExportModelAdmin is a Django admin class that adds
#import/export functionality (CSV, Excel, etc.) to your model admin via the django-import-export package.
#pip install django-import-export
from django import forms#Imports Django’s form classes — used to create and handle HTML forms in Python,
#including validation and rendering. Essential for building custom forms or model-based forms (ModelForm).
from userauth.models import User
from vendor.models import Vendor
@admin.action(description="Mark selected products as published")
#It labels the action in the admin UI as “Mark selected products as published”, making it user-friendly and self-explanatory.
def make_published(modeladmin, request, queryset):
    queryset.update(status="published")
@admin.action(description="Mark selected products as In Review")
def make_in_review(modeladmin, request, queryset):
    queryset.update(status="in_review")
   
@admin.action(description="Mark selected products as Featured")
def make_featured(modeladmin, request, queryset):
    queryset.update(featured=True)
   
class ProductImagesAdmin(admin.TabularInline):
#Defines an inline admin interface to manage related ProductImages directly within the parent model’s admin
# page using a table layout.
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
#Defines a custom form for the Django admin to manage Product model data, allowing validation or field
# customization beyond the default.
    class Meta:
        model = Product
        fields = '__all__'
    vendor = forms.ModelChoiceField(queryset=Vendor.objects.filter(user__is_staff=True))
#Creates a dropdown field in the form to select a Vendor whose associated user has staff privileges (is_staff=True).
#Registers multiple inline admin classes to allow editing related models (ProductImages, Specification, Color, Size) directly within the Product admin page.
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
    list_display_links = ['title'] # title is the only clickable link
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
   
class ProductOfferAdmin(ImportExportModelAdmin):
    list_display = ['user', 'product', 'price','status', 'email']
   
class CouponAdmin(ImportExportModelAdmin):
    inlines = [CouponUsersInlineAdmin]
    list_editable = ['code', 'active', ]
    list_display = ['vendor' ,'code', 'discount', 'active', 'date']
       
class ProductReviewAdmin(ImportExportModelAdmin):
    list_editable = ['active']
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

# New: Register Offer Models
class ProductOfferAdmin(ImportExportModelAdmin):
    list_display = ['discount_percentage', 'start_date', 'end_date', 'is_active']
    list_editable = ['is_active']
    filter_horizontal = ['products']  # For ManyToManyField

class CategoryOfferAdmin(ImportExportModelAdmin):
    list_display = ['discount_percentage', 'start_date', 'end_date', 'category', 'is_active']
    list_editable = ['is_active']
    list_filter = ['category', 'is_active']

class ReferralOfferAdmin(ImportExportModelAdmin):
    list_display = ['token', 'referring_user', 'is_used', 'created_at', 'expiry_date']
    list_filter = ['is_used']
    readonly_fields = ['token']  # Token is auto-generated
   
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
# Register new offer models
admin.site.register(ProductOffer, ProductOfferAdmin)
admin.site.register(CategoryOffer, CategoryOfferAdmin)
admin.site.register(ReferralOffer, ReferralOfferAdmin)
# admin.site.register(Size )
# admin.site.register(Color )
# admin.site.register(Specification )
# admin.site.register(Gallery )