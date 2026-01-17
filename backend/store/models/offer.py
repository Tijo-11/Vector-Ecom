# store/models/offer.py
from django.db import models
from django.utils import timezone
from shortuuid.django_fields import ShortUUIDField
from userauth.models import User
from .product import Product
from .category import Category
from .order import Coupon
from vendor.models import Vendor
import shortuuid

class ProductOffer(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='offers', null=True, blank=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    products = models.ManyToManyField(Product, related_name='product_offers')

    def __str__(self):
        return f"{self.discount_percentage}% on {self.products.count()} products"

    def save(self, *args, **kwargs):
        if self.end_date and self.start_date >= self.end_date:
            raise ValueError("Start date must be before end date")
        super().save(*args, **kwargs)

class CategoryOffer(models.Model):
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='category_offers')
    is_active = models.BooleanField(default=True)


    def __str__(self):
        return f"{self.discount_percentage}% off on {self.category.title}"

    def save(self, *args, **kwargs):
        if self.end_date and self.start_date >= self.end_date:
            raise ValueError("Start date must be before end date")
        super().save(*args, **kwargs)

class ReferralOffer(models.Model):
    token = models.CharField(max_length=36, unique=True, default=shortuuid.uuid)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    expiry_date = models.DateTimeField(null=True, blank=True)
    referring_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals')
    reward_coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Referral {self.token} by {self.referring_user.username}"