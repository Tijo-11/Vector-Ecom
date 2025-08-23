from django.db import models

# Create your models here.
from shortuuid.django_fields import ShortUUIDField
#Imports a Django model field that generates short, unique IDs using the shortuuid library.
#Useful for replacing default UUIDs with shorter, URL-friendly identifiers in Django models.
from django.utils.html import mark_safe #Marks a string as safe for HTML rendering in templates.
#Prevents Django from auto-escaping HTML tags, allowing raw HTML to be rendered. Use cautiously to avoid XSS risks.
from django.utils import timezone#Provides timezone-aware date and time utilities.
#Used to get the current time (timezone.now()) that respects Django’s configured timezone settings.
from django.template.defaultfilters import escape#Escapes HTML special characters in a string
#Converts <, >, &, etc. into safe entities (&lt;, &gt;, &amp;) to prevent HTML injection in templates.
from django.urls import reverse #Generates the URL path for a given view name.
#Used to dynamically build URLs in views or templates, avoiding hardcoding and ensuring maintainability.
#Instead of hardcoding a URL like "/products/42/", you can do:reverse("product-detail", args=[42])
#This will return the correct URL for the view named "product-detail" with ID 42, based on your urls.py setup.
#Why it's useful: If you ever change your URL patterns, reverse() keeps your code working without manual updates.
from django.shortcuts import redirect #Redirects the user to a different URL or view.
#Commonly used in views after form submission or login to send users to another page(e.g., redirect('home')).
from django.dispatch import receiver #Decorator that connects a function to a Django signal.
#Used to trigger custom logic when specific events occur (e.g., model save/delete), like:
#@receiver(post_save, sender=MyModel)
# def do_something(sender, instance, **kwargs): This runs do_something after MyModel is saved.
from django.utils.text import slugify#Converts a string into a URL-friendly “slug”.
#Replaces spaces and special characters with hyphens, and lowercases the text 
# — useful for clean URLs like "My Blog Post" → "my-blog-post".
from django.core.validators import MinValueValidator, MaxValueValidator
#Adds validation constraints to numeric fields in Django models.
#Ensures values stay within a defined range — e.g., MinValueValidator(1) prevents values below 1, and 
# MaxValueValidator(100) blocks values above 100.
from django.db.models.signals import post_save#Signal triggered after a model instance is saved.
#Used to run custom logic (e.g., sending emails, updating related models) right after save() is called on a 
# model. Commonly paired with @receiver.
from userauth.models import User, user_directory_path, Profile
from vendor.models import Vendor

import shortuuid#Imports the shortuuid library to generate short, unique, URL-safe IDs.
#It's a compact alternative to Python’s built-in uuid, often used for cleaner database keys or public-facing identifiers.
import datetime
#Imports Python’s built-in datetime module for working with dates and times.
#Used to create, manipulate, and format date/time objects — e.g., datetime.datetime.now() gives the current timestamp.
import os
#Imports Python’s os module for interacting with the operating system.
#Used for tasks like reading environment variables, handling file paths, or accessing the file system — e.g., 
# os.path.join() or os.getenv().


from .product import Product
from .category_brand_tag import Category, Brand, Tag
from .order import Cart, CartOrder, CartOrderItem, CancelOrder, Coupon, CouponUsers, DeliveryCountries
from .user import Wishlist, Address, Notifications
from .review import Review
from .choices import (
    STATUS, RATING, PRODUCT_TYPE, PAYMENT_STATUS, ORDER_STATUS,
    DISCOUNT_TYPE, DELIVERY_STATUS, OFFER_STATUS, WIN_STATUS,
    PRODUCT_CONDITION, PRODUCT_CONDITION_RATING, PAYMENT_METHOD
)
__all__ = [
    "Product", "Category", "Brand", "Tag", "Specification", "Size", "Color", "Gallery", "ProductFaq",
    "Cart", "CartOrder", "CartOrderItem", "CancelOrder", "Coupon", "CouponUsers", "DeliveryCountries",
    "Wishlist", "Address", "Notifications", "Review",
    #choices
    "DISCOUNT_TYPE", "STATUS_CHOICE", "STATUS", "PAYMENT_STATUS", "ORDER_STATUS",
    "AUCTION_STATUS", "WIN_STATUS", "PRODUCT_TYPE", "OFFER_STATUS",
    "PRODUCT_CONDITION", "PRODUCT_CONDITION_RATING", "DELIVERY_STATUS",
    "PAYMENT_METHOD", "RATING",
]

#__all__ is a declaration of what should be exported when someone does from models import *,
# but it doesn't import anything by itself.
#Without the actual imports, Python won’t know what Product or Review even are.












'''
he __init__.py file in your models/ directory can be a powerful tool to streamline your imports and make
your codebase cleaner and more DRY.

Here’s how you can use it effectively:

🧩 Purpose of __init__.py in a models/ Directory
When you split your models across multiple files (like product.py, order.py, etc.), Django won’t 
automatically know where to find them unless you import them somewhere. That’s where __init__.py comes in.

✅ What You Can Do in __init__.py
1. Centralize Model Imports
Instead of importing models from individual files throughout your project, you can expose them all
from __init__.py:

python
# models/__init__.py

from .product import Product, Category, Brand, Tag, Specification, Size, Color, Gallery, ProductFaq
from .order import Cart, CartOrder, CartOrderItem, CancelOrder, Coupon, CouponUsers, DeliveryCountries
from .user import Wishlist, Address, Notifications
from .review import Review
Now you can simply do:

python
from your_app.models import Product, CartOrder
instead of:

python
from your_app.models.product import Product
from your_app.models.order import CartOrder
2. Expose Shared Constants
If you also move your choice tuples to a choices.py file, you can import them here too:

python
from ..choices import (
    DISCOUNT_TYPE, STATUS_CHOICE, STATUS, PAYMENT_STATUS, ORDER_STATUS,
    AUCTION_STATUS, WIN_STATUS, PRODUCT_TYPE, OFFER_STATUS,
    PRODUCT_CONDITION, PRODUCT_CONDITION_RATING, DELIVERY_STATUS,
    PAYMENT_METHOD, RATING
)
This makes them available wherever you import from models.

3. Avoid Circular Imports
By centralizing imports in __init__.py, you reduce the risk of circular dependencies between model files 
— especially helpful when models reference each other via ForeignKey or ManyToMany relationships.

🧠 Bonus Tip: Use __all__ for Clarity
You can define __all__ to explicitly declare what’s exported:

python
__all__ = [
    "Product", "Category", "Brand", "Tag", "Specification", "Size", "Color", "Gallery", "ProductFaq",
    "Cart", "CartOrder", "CartOrderItem", "CancelOrder", "Coupon", "CouponUsers", "DeliveryCountries",
    "Wishlist", "Address", "Notifications", "Review"
'''