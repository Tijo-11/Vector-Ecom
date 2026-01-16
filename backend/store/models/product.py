from django.db import models
from django.utils.html import mark_safe
from django.utils import timezone
from django.utils.text import slugify
from shortuuid.django_fields import ShortUUIDField
import shortuuid
import uuid
from vendor.models import Vendor
from .choices import STATUS, PRODUCT_TYPE

# Custom upload path for product images with unique filenames
def product_image_path(instance, filename):
    """Generate unique path for each product image"""
    ext = filename.split('.')[-1]
    unique_filename = f'{uuid.uuid4()}.{ext}'
    return f'products/{unique_filename}'

# Model for Products
class Product(models.Model):
    title = models.CharField(max_length=100)
    # FIXED: Using unique upload path instead of user_directory_path
    image = models.FileField(upload_to=product_image_path, blank=True, null=True, default="product.jpg")
    description = models.TextField(null=True, blank=True)
    # Categories that the product belongs to
    category = models.ForeignKey('store.Category', on_delete=models.SET_NULL, null=True, blank=True, related_name="category")
    # Tags associated with the product
    tags = models.CharField(max_length=1000, null=True, blank=True)
    # Brand associated with the product
    brand = models.CharField(max_length=100, null=True, blank=True)
    
    '''*************# Price and other financial details*****************'''
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    shipping_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Stock quantity and availability status
    stock_qty = models.PositiveIntegerField(default=0)
    in_stock = models.BooleanField(default=True)
    
    # Product status and type
    status = models.CharField(choices=STATUS, max_length=50, default="published", null=True, blank=True)
    type = models.CharField(choices=PRODUCT_TYPE, max_length=50, default="regular")
    
    # Product flags (featured, hot deal, special offer, digital)
    featured = models.BooleanField(default=False)
    hot_deal = models.BooleanField(default=False)
    special_offer = models.BooleanField(default=False)
    digital = models.BooleanField(default=False)
    
    # Product statistics (views, orders, saved, rating)
    views = models.PositiveIntegerField(default=0, null=True, blank=True)
    orders = models.PositiveIntegerField(default=0, null=True, blank=True)
    saved = models.PositiveIntegerField(default=0, null=True, blank=True)
    rating = models.IntegerField(default=0, null=True, blank=True)
    
    ## Vendor associated with the product
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name="vendor")
    
    # Unique short UUIDs for SKU and product
    sku = ShortUUIDField(unique=True, length=5, max_length=50, prefix="SKU", alphabet="1234567890")
    pid = ShortUUIDField(unique=True, length=10, max_length=20, alphabet="abcdefghijklmnopqrstuvxyz")
    # Slug for SEO-friendly URL
    slug = models.SlugField(null=True, blank=True)
    # Date of product creation
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-id']
        verbose_name_plural = "Products"
    
    # Returns an HTML image tag for the product's image
    def product_image(self):
        return mark_safe('<img src="%s"  width="50" height="50" style="object-fit:cover; border-radius: 6px;" />' %(self.image.url))

    def __str__(self):
        return self.title
    
    # Returns the count of products in the same category as this product
    def category_count(self):
        return Product.objects.filter(category=self.category).count()
    
    # Calculates the discount percentage (returns 0 as old_price has been removed)
    def get_percentage(self):
        return 0
    
    # Calculates the average rating of the product
    def product_rating(self):
        from .review import Review
        if self.pk:  # Only query if the product is saved
            product_rating = Review.objects.filter(product=self).aggregate(avg_rating=models.Avg('rating'))
            return product_rating['avg_rating'] or 0  # Return 0 if no reviews exist
        return 0  # Return 0 for unsaved instances
    
    # Returns the count of ratings for the product
    def rating_count(self):
        from .review import Review
        rating_count = Review.objects.filter(product=self).count()
        return rating_count
    
    # Returns the count of orders for the product with "paid" payment status
    def order_count(self):
        from .order import CartOrderItem
        order_count = CartOrderItem.objects.filter(product=self, order__payment_status="paid").count()
        return order_count
    
    # Returns the gallery images linked to this product
    def gallery(self):
        from .item import Gallery
        gallery = Gallery.objects.filter(product=self)
        return gallery
    
    def specification(self):
        from .item import Specification
        return Specification.objects.filter(product=self)
    
    def color(self):
        from .item import Color
        return Color.objects.filter(product=self)
    
    def size(self):
        from .item import Size
        return Size.objects.filter(product=self)
    
    # Returns a list of products frequently bought together with this product
    def frequently_bought_together(self):
        from .order import CartOrder
        frequently_bought_together_products = Product.objects.filter(
            order_item__order__in=CartOrder.objects.filter(orderitem__product=self)
        ).exclude(id=self.id).annotate(count=models.Count('order_item')).order_by('-count')[:3]
        return frequently_bought_together_products
    
    # Custom save method to generate a slug if it's empty, update in_stock, and calculate the product rating
    def save(self, *args, **kwargs):
        if self.slug == "" or self.slug is None:
            uuid_key = shortuuid.uuid()
            uniqueid = uuid_key[:4]
            self.slug = slugify(self.title) + "-" + str(uniqueid.lower())
        
        if self.stock_qty is not None:
            if self.stock_qty == 0:
                self.in_stock = False
            elif self.stock_qty > 0:
                self.in_stock = True
            else:
                self.stock_qty = 0
                self.in_stock = False
        
        self.rating = self.product_rating()
        super(Product, self).save(*args, **kwargs)