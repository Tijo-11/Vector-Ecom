from django.contrib import admin
from store.models import CartOrderItem, CouponUsers, Notification, Product, Tag ,Category
from store.models import Cart, DeliveryCouriers, CartOrder, Gallery, Brand, ProductFaq, Review
from store.models import Specification, Coupon, Color, Size, Address, Wishlist

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
#modeladmin is the instance of your custom ModelAdmin class — passed automatically by Django when an admin 
# action is triggered. It gives access to: The model (modeladmin.model), admin methods and config, 
#Useful utilities like logging or saving changes.
#It comes from the Django admin system when you select rows and run an action — Django calls your function like:
#make_published(self, request, queryset) Where self is your ModelAdmin instance — passed as modeladmin.
    queryset.update(status="published")
#🚀 Bulk-updates all selected rows in the queryset by setting their status field to "published" — efficient 
# because it avoids looping and saves directly to the database in one query.
