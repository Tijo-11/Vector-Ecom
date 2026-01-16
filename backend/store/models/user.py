# Wishlist, Address, Notifications

from django.db import models 
from userauth.models import User
from vendor.models import Vendor 
from .order import CartOrder, CartOrderItem

# Define a model for Wishlist
class Wishlist(models.Model):
    # A foreign key relationship to the User model with CASCADE deletion
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    # A foreign key relationship to the Product model with CASCADE deletion, specifying a related name
    product = models.ForeignKey('store.Product', on_delete=models.CASCADE, related_name="wishlist")
    # Date and time field
    date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Wishlist"
    
    # Method to return a string representation of the object
    def __str__(self):
        if self.product.title:
            return self.product.title
        else:
            return "Wishlist"
        
        
# Define a model for Notification
class Notification(models.Model):
    # A foreign key relationship to the User model with CASCADE deletion
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    # A foreign key relationship to the Vendor model with CASCADE deletion
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    # A foreign key relationship to the CartOrder model with CASCADE deletion, specifying a related name
    order = models.ForeignKey(CartOrder, on_delete=models.SET_NULL, null=True, blank=True)
    # A foreign key relationship to the CartOrderItem model with CASCADE deletion, specifying a related name
    order_item = models.ForeignKey(CartOrderItem, on_delete=models.SET_NULL, null=True, blank=True)
    # Is read Boolean Field
    seen = models.BooleanField(default=False)
    # Date and time field
    date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Notification"
    
    # Method to return a string representation of the object
    def __str__(self):
        if self.order:
            return self.order.oid
        else:
            return "Notification"
        
# Define a model for Address
class Address(models.Model):
    # A foreign key relationship to the User model with CASCADE deletion
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    # Fields for full name, mobile, email, country, state, town/city, address, zip code, and status
    full_name = models.CharField(max_length=200)
    mobile = models.CharField(max_length=50)
    email = models.CharField(max_length=100)
    country = models.CharField(max_length=100, blank=True, null=True)
    town_city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=100)
    zip = models.CharField(max_length=100)
    status = models.BooleanField(default=False)
    same_as_billing_address = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = "Address"
    
    # Method to return a string representation of the object
    def __str__(self):
        if self.user:
            return self.user.username
        else:
            return "Address"