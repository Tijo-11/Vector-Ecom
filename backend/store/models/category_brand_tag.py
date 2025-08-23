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

from .models import *
# Model for Product Categories
class Category(models.Model):
    # Category title
    title = models.CharField(max_length=100)
    # Image for the category
    image = models.ImageField(upload_to=user_directory_path, default='category.jpg', null =True, blank=True)
    # - Saves to path returned by user_directory_path
    # - Uses 'category.jpg' if no image is uploaded
    # Is the category active?
    active = models.BooleanField(default=True)
    # Slug for SEO-friendly URLs
    slug = models.SlugField(null=True, blank=True)
    class Meta:
        verbose_name_plural = "Categories"
## Sets plural name for the model in Django admin as "Categories". This is purely for display—helps Django
# admin show a human-friendly plural instead of auto-generating one like “Categorys”
    def thumbnail(self):
    # Returns a safe HTML <img> tag for displaying the image in Django admin:
    # - Uses image URL from mode,# - Sets fixed size (50x50), rounded corners, and cover fit
    # - mark_safe prevents Django from escaping the HTML
        return mark_safe('<img src="%s" width="50" height="50" style="object-fit:cover; border-radius: 6px;" />' % (self.image.url))
    # Typically used in ModelAdmin or model methods to preview images directly in the admin panel.
    '''In Django, when you return HTML content—like an <img> tag—from a Python method, Django automatically escapes 
it to prevent security issues like cross-site scripting (XSS). That means it turns characters like < and > into
&lt; and &gt;, so the browser shows them as plain text instead of rendering them as HTML.

🔒 Escaping protects users, but sometimes you want Django to treat your string as safe HTML—like when you're
deliberately generating a trusted image tag for the admin panel.

That’s where mark_safe() comes in:

✅ What mark_safe() does:
It tells Django: “This HTML is safe, don’t escape it.”

So instead of showing &lt;img src="..."&gt;, it actually renders the image.

⚠️ Use with caution:
Only use mark_safe() when you're 100% sure the content is safe and not coming from user input. Otherwise, 
you could open the door to malicious code injection.'''
    def __str__(self):
        return self.title
    # Returns the count of products in this category
    def product_count(self):
        product_count = Product.objects.filter(category=self).count()
        return  product_count
    # Returns the products in this category
    def cat_products(self):
        return Product.objects.filter(category=self)
    
    # Custom save method to generate a slug if it's empty
    def save(self, *arg, **kwargs):
        if self.slug =="" or self.slug == None:
            uuid_key = shortuuid.uuid()
    ## Generates a short, unique ID using shortuuid.Great for creating compact, URL-safe identifiers for
    # models, tokens, or public-facing keys.
            uniqueid = uuid_key[:4]
            self.slug = slugify(self.title) +'-' + str(uniqueid.lower())
        super(Category, self).save(*arg, **kwargs)
#invoking the save() method from the superclass of Category, which is common in Django models when you 
# want to customize the save behavior but still preserve the default functionality.
#super(Category, self): Refers to the parent class of Category, which is models.Model.
#.save(*args, **kwargs): Calls the original save() method, passing along any arguments.
    
#/****************************************************************************************/    
# Model for Tags
class Tag(models.Model):
    # Tag title
    title = models.CharField(max_length=30)
    # Category associated with the tag
    category = models.ForeignKey(Category, default="", verbose_name = "Category", on_delete=models.protect)
    #defines a many-to-one relationship, not one-to-one. Many Tag instances can point to the same Category
    #But each Tag links to only one Category.
    ## verbose_name: label shown in admin/forms ("Category" instead of "category")
    ## on_delete=models.PROTECT: prevents deletion of Category if it's linked here
    #PROTECT ensures data integrity—Django raises an error if you try to delete a Category that's still in use.
    #If you delete a Tag instance, here's what happens:The Tag is removed from the database
    #Its link to the Category is also removed — but the Category itself remains untouched.
    #This is because the ForeignKey is defined on Tag, pointing to Category, and the on_delete=models.PROTECT
    # applies only when deleting the Category, not the Tag.
    #Deleting a Tag → allowed., Deleting a Category → blocked if any Tag still references it.
    active = models.BooleanField(default=True)
    slug = models.SlugField("Tag slug", max_length=30, null=False, blank=False, unique=True)
    #"Tag slug" is the human-readable label shown in Django admin and forms — it's the verbose_name 
    # for the slug field. So instead of seeing just slug, users see "Tag slug" as the field label, 
    # is clearer and more descriptive. f you omit it, Django auto-generates the label from the field name (slug).
    # Adding "Tag slug" makes it more user-friendly.
    #Then why we didn't give it like verbose_name = "Category"
    #"Tag slug" is treated as verbose_name because it's the first argument.
    # or you can pass as Keyword argument (used in ForeignKey):
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name_plural = "Tags"
        ordering = ('title',)
#ordering = ('title',) tells Django to sort query results by the title field by default — 
# whether in admin, forms, or when using .all() on the model.
#So instead of getting tags in random DB order, you get them alphabetically (or however title is defined). 
# It’s like setting a default sort rule so you don’t have to write .order_by('title') every time.
        
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

#/*************************************************************************************************

    
     
    


     
    
    