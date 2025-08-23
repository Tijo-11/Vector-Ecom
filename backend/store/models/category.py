#Category, brand, tag
from django.db import models
from django.utils.html import mark_safe
from django.utils.text import slugify
from shortuuid.django_fields import ShortUUIDField
import shortuuid
from userauth.models import user_directory_path
from .common import *

#Category  causes circular import between product and category, review and product etc.


'''
Option 2: Use a Lazy Reference (String-based ForeignKey)
If Category does need a reference to Product (e.g., a ManyToManyField or ForeignKey), you can use a string-based 
reference instead of importing the Product class directly. Django allows you to specify the related model as a 
string in the format 'app_name.ModelName' or just 'ModelName' if the model is in the same app.
For example, in category.py:
pythonclass Category(models.Model):
    name = models.CharField(max_length=100)
    # Instead of ManyToManyField(Product, ...), use a string
    products = models.ManyToManyField('Product', related_name="categories",'''
# Or, if you need to specify the app name explicitly (e.g., store is your app):
# pythonproducts = models.ManyToManyField('store.Product', related_name="categorie

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
    category = models.ForeignKey('store.Category', default="", verbose_name = "Category", on_delete=models.PROTECT)
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

# The issue in category.py is the circular import caused by the Product import in the product_count and cat_products methods, which reference Product.objects directly. This creates a circular dependency because product.py imports Category, and category.py references Product. To resolve this, I'll move the Product import inside the product_count and cat_products methods to delay the import until the methods are called, thus avoiding circular imports. I'll also use a string-based reference ('store.Category') for the ForeignKey in the Tag model, as you already have it correctly set up. All comments will be preserved, and no ForeignKey relationships will be changed.
# Changes Made to category.py

# Removed Product References at Module Level:

# The product_count and cat_products methods directly used Product.objects, which requires importing Product at the module level and causes a circular import with product.py.
# Moved the Product import inside the product_count and cat_products methods to delay the import until the methods are executed.


# Preserved String-based ForeignKey:

# The ForeignKey in the Tag model already uses 'store.Category', which is correct and avoids importing Category directly. No changes were needed here.


# Preserved All Comments: All comments, including explanations about mark_safe, on_delete=models.PROTECT, verbose_name, ordering, and other Django concepts, are kept verbatim.
# Fixed Minor Typos:

# Corrected save method's *arg to *args for proper Python syntax.
# Ensured consistent spacing and formatting for readability, while keeping all comments intact.