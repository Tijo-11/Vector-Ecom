from django.db import models

# Create your models here.
from django.db import models
from shortuuid.django_fields import ShortUUIDField
from django.utils.html import mark_safe
from django.utils import timezone
from django.template.defaultfilters import escape
from django.urls import reverse
from django.shortcuts import redirect
from django.dispatch import receiver
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver


from userauth.models import User, user_directory_path, Profile
from vendor.models import Vendor

import shortuuid
import datetime
import os 


# Model for Products
class Product(models.Model):
    title = models.CharField(max_length=100)
    image = models.FileField(upload_to=user_directory_path, blank=True, null=True, default="product.jpg")
    description = models.TextField(null=True, blank=True)
    # Categories that the product belongs to
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="category")
#on_delete=models.SET_NULL means:, If a Category is deleted, the category field in Product will be set
# to NULL — instead of deleting the Product. This works only because null=True is set — it allows the field to 
# be empty in the database. You can delete a Category without breaking Product
#Also, blank=True lets you leave the field empty in forms/admin.
#Many Product instances can link to the same Category.
    # Tags associated with the product
    tags = models.CharField(max_length=1000, null=True, blank=True)
    # Brand associated with the product
    brand = models.CharField(max_length=100, null=True, blank=True)
    #technically it's valid, but not ideal if Tag and Brand are separate models.
    #No relational integrity — you can't enforce valid tags or brands.
    #No reverse lookup — can't query which products use a specific brand or tag.
    #Harder to filter, join, or manage in admin.
    #brand = models.ForeignKey(Brand, null=True, blank=True, on_delete=models.SET_NULL)
    #tags = models.ManyToManyField(Tag, blank=True) // is better alternative
    #This way: Product links to one Brand., Product can have multiple Tags.
    #ou get full ORM power: .filter(tags__name="Eco"), .brand.name, etc.
    
    
    '''*************# Price and other financial details*****************'''
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    old_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
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
    #If a Vendor is deleted, Django will set the vendor field in Product to NULL.
    #It does not prevent deletion of the Vendor. It ensures the Product isn't deleted — it just loses its vendor reference.
    #So the deletion logic is enforced on the Product side, to control what happens to its vendor field when the 
    # linked Vendor disappears.
    
    # Unique short UUIDs for SKU and product
    sku = ShortUUIDField(unique=True, length=5, max_length=50, prefix="SKU", alphabet="1234567890")
    #sku stands for Stock Keeping Unit — a unique identifier for each product.
    #Useful for inventory tracking, order management, and clean URLs.
    pid = ShortUUIDField(unique=True, length=10, max_length=20, alphabet="abcdefghijklmnopqrstuvxyz")
    #product id
    # Slug for SEO-friendly URL
    slug = models.SlugField(null=True, blank=True)
    # Date of product creation
    date = models.DateTimeField(default=timezone.now)
    class Meta:
        ordering = ['-id']
        verbose_name_plural = "Products"
    # Returns an HTML image tag for the product's image
    def product_image(self):
        return mark_safe('<img src="%s"  width="50" height="50" style="object-fit:cover; border-radius: 6px;" />' %(self.img.url))


    def __str__(self):
        return self.title
     # Returns the count of products in the same category as this product
    def category_count(self):
        return Product.object.filter(category=(self.category).count())
## category__in expects an iterable (e.g. list of Category objects or IDs), no need to use here
    # Calculates the discount percentage between old and new prices
    def get_percentage(self):
        percentage = ((self.price - self.old_price)/self.old_price)*100
        return round(percentage, 0)
    
    # Calculates the average rating of the product
    def product_rating(self):
        product_rating = Review.objects.filter(product=self).aggregate(avg_rating= models.Avg('rating'))
        return product_rating['avg_rating']
    #the separate return statement is needed because .aggregate() returns a dictionary, not a direct value.
    
    # Returns the count of ratings for the product
    def rating_count(self):
        rating_count = Review.objects.filter(product=self).count()
        return rating_count
    # Returns the count of orders for the product with "paid" payment status
    def order_count(self):
        order_count = CartOrderItem.objects.filter(product=self, order__payment_status="paid").count()
        return order_count
    # Returns the gallery images linked to this product
    def gallery(self):
        gallery = Gallery.objects.filter(product=self)
        return gallery
    def specification(self):
        return Specification.objects.filter(product=self)
    def color(self):
        return Color.objects.filter(product=self)
    def size(self):
        return Size.objects.filter(product=self)
    # Returns a list of products frequently bought together with this product
    def frequently_bought_together(self):
        frequently_bought_together_products = Product.objects.filter(order_item__order__in=CartOrder.objects.filter(orderitem__product=self)).exclude(id=self.id).annotate(count=models.Count('id')).order_by('-id')[:3]
        #CartOrder.objects.filter(orderitem__product=self), Finds all orders that contain the current product (self).
        #Product.objects.filter(order_item__order__in=...)Finds all products that were part of those same orders.
        #.exclude(id=self.id)
        #.annotate(count=models.Count('id')),Counting 'id' doesn’t give you frequency of co-purchase — it just counts instances of the product.
        #A better approach might be Count('order_item') or Count('order_item__order') to reflect how often the product appears in shared orders.
        #.order_by('-id')[:3],Orders the results by descending product ID (not by frequency).
        #This might not be ideal — you'd probably want to order by the count instead:
        #.order_by('-count')[:3]
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
            