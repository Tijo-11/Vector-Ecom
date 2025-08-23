# Gallery, Specification, Color, Size


from .common import *
from .product import Product

class Gallery(models.Model):
    product = models.ForeignKey('store.Product', on_delete=models.CASCADE, null=True)
        # Links to Product model; deletes this if Product is deleted; allows null value
    image = models.FileField(upload_to=user_directory_path, default="gallery.jpg")
    active = models.BooleanField(default=True)
    date = models.DateTimeField(auto_now_add=True)
    # Unique short UUID for gallery image
    gid = ShortUUIDField(length=10, max_length=25, alphabet="abcdefghijklmnopqrstuvxyz")
    
    class Meta:
        ordering = ["date"]
        verbose_name_plural = "Product Images"
    def __str__(self):
        return "Image"
    
# Model for Product Specifications
class Specification(models.Model):
    # Product associated with the specification
    product = models.ForeignKey('store.Product', on_delete=models.CASCADE, null=True)
    # Specification title
    title = models.CharField(max_length=100, blank=True, null=True)
    content = models.CharField(max_length=1000, blank=True, null=True)
    
# Model for Product Sizes
class Size(models.Model):
    # Product associated with the size
    product = models.ForeignKey('store.Product', on_delete=models.CASCADE, null=True)
    # Size name
    name = models.CharField(max_length=100, blank=True, null=True)
    # Price for the size
    price = models.DecimalField(default=0.00, decimal_places=2, max_digits=12)

# Model for Product Colors
class Color(models.Model):
    # Product associated with the color
    product = models.ForeignKey('store.Product', on_delete=models.CASCADE, null=True)
    # Color name
    name = models.CharField(max_length=100, blank=True, null=True)
    # Color code (if applicable)
    color_code = models.CharField(max_length=100, blank=True, null=True)
    # Image for the color
    image = models.FileField(upload_to=user_directory_path, blank=True, null=True)
    