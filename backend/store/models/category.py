#Category, brand, tag
from django.db import models
from django.utils.html import mark_safe
from django.utils.text import slugify
from shortuuid.django_fields import ShortUUIDField
import shortuuid
from userauth.models import user_directory_path
from .common import *

#Category  causes circular import between product and category, review and product etc.




class Category(models.Model):
    # Category title
    title = models.CharField(max_length=100)
    # Image for the category
    image = models.ImageField(upload_to=user_directory_path, default='category.jpg', null =True, blank=True)
    
    active = models.BooleanField(default=True)
    # Slug for SEO-friendly URLs
    slug = models.SlugField(null=True, blank=True)
    class Meta:
        verbose_name_plural = "Categories"

    def thumbnail(self):
   
        return mark_safe('<img src="%s" width="50" height="50" style="object-fit:cover; border-radius: 6px;" />' % (self.image.url))
    # Typically used in ModelAdmin or model methods to preview images directly in the admin panel.
    
    def __str__(self):
        return self.title
    # Returns the count of products in this category
    def product_count(self):
        from .product import Product
        product_count = Product.objects.filter(category=self).count()
        return  product_count
    # Returns the products in this category
    def cat_products(self):
        from .product import Product
        return Product.objects.filter(category=self)
    
    # Custom save method to generate a slug if it's empty
    def save(self, *args, **kwargs):
        if self.slug =="" or self.slug == None:
            uuid_key = shortuuid.uuid()
    ## Generates a short, unique ID using shortuuid.Great for creating compact, URL-safe identifiers for
    # models, tokens, or public-facing keys.
            uniqueid = uuid_key[:4]
            self.slug = slugify(self.title) +'-' + str(uniqueid.lower())
        super(Category, self).save(*args, **kwargs)
#invoking the save() method from the superclass of Category,

#/****************************************************************************************/    
# Model for Tags
class Tag(models.Model):
    # Tag title
    title = models.CharField(max_length=30)
    # Category associated with the tag
    category = models.ForeignKey('store.Category', default="", verbose_name = "Category", on_delete=models.PROTECT)
    
    active = models.BooleanField(default=True)
    slug = models.SlugField("Tag slug", max_length=30, null=False, blank=False, unique=True)
    
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name_plural = "Tags"
        ordering = ('title',)

        
# Model for Brands
class Brand(models.Model):
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to=user_directory_path, default="brand.jpg", null=True, blank=True)
    active = models.BooleanField(default=True)
    class Meta:
        verbose_name_plural = "Brands"
    def brand_image(self):
        return mark_safe('<img src="%s" width="50" height="50" style="object-fit:cover; border-radius:6px"/>' % (self.image.url))
#this line is using Python string formatting to dynamically insert the image URL into the HTML:
#"%s" is a placeholder for a string.
#% (self.image.url) replaces %s with the actual URL of the image file.
#mark_safe(...) tells Django: “This HTML is safe to render as-is” — so it won’t escape the tags.
    def __str__(self):
        return self.title

