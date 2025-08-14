from django.db import models # Imports Django's ORM tools to define and interact with database tables as Python classes.
import os
import uuid#This line imports Python’s built-in uuid module, which is used to generate universally unique 
#identifiers (UUIDs). These are handy for creating unique IDs for objects, especially when you don’t want 
# to expose sequential database IDs. It’s often used in Django models to assign unique primary keys or reference codes.
from shortuuid.django_fields import ShortUUIDField #This line imports ShortUUIDField from the shortuuid package’s 
#Django integration. It’s a custom model field that generates shorter, URL-safe UUIDs compared to Django’s default
# #UUIDField. Useful for creating compact, unique identifiers for models—especially when you want readable IDs 
# #in URLs or APIs without exposing sequential primary keys. #pip install django-shortuuidfield
from django.utils import timezone
#provides timezone-aware date and time functions. It’s preferred over Python’s datetime.now() because it respects 
# Django’s timezone settings (USE_TZ = True in settings.py).This ensures consistent and accurate time handling across different regions and deployments.
from django.db.models.signals import post_save#This line imports the post_save signal from Django’s model signals
#framework. It allows you to trigger custom logic after a model instance is saved—whether it’s newly created or 
# updated. Common use cases include automatically creating a profile when a new user is registered or sending 
# notifications after saving a record.

from django.utils.html import mark_safe#It’s used to explicitly mark a string as safe for HTML rendering,
#bypassing Django’s automatic escaping. This is useful when you want to render raw HTML 
# (like <strong>text</strong>) in templates or admin fields.
'''
AbstractBaseUser

`AbstractBaseUser` is the most minimal base class provided by Django for creating a custom user model. 
It includes only the essential fields and methods required for authentication. The fields it provides are
`password`, `last_login`, and `is_active`. These are enough to handle login and account status, but you must
define other fields like `email`, `username`, or any profile-related data yourself.
In terms of methods, `AbstractBaseUser` gives you `set_password()` to securely hash and store a password, 
and `check_password()` to verify a raw password against the stored hash. It also includes `get_username()`,
which returns the identifier field (such as email or username, depending on your setup). Methods like 
`get_full_name()` and `get_short_name()` are not implemented by default — you’re expected to define them 
in your custom model.
This class is ideal when you want full control over how users are identified and authenticated, but it requires more setup and configuration.
---
 AbstractUser
`AbstractUser` builds on `AbstractBaseUser` and includes all the fields and methods found in Django’s default
`User` model. It’s a more complete starting point for customization. In addition to the fields from 
`AbstractBaseUser`, it provides `id`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`,
`is_active`, and `date_joined`. These cover most common use cases for user data and permissions.
The methods available include everything from `AbstractBaseUser`, plus `get_full_name()` (which returns the user's
first and last name combined), `get_short_name()` (which returns just the first name), and `email_user()` (which sends an email to the user).
`AbstractUser` is a great choice if you want to customize the user model slightly — for example, by adding extra fields — without rebuilding
the entire authentication system from scratch.
'''
from django.contrib.auth.models import AbstractUser
GENDER = (
    ("female", "Female"),
    ("male", "Male"),
    ("others", "Others")
)

# Create your models here.
class User(AbstractUser):
    username = models.CharField(max_length=500, null=True, blank=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=500, null=True, blank=True)
    phone = models.CharField(max_length=20) # a lot of countries have their own different way of# actually 
    #formatting phone numbers. that's why charfield instead of integerfield
#If for any reason you have a feature that requires that you manually put in an integer field for the
# phone number, gently use Jango phone number fields and converts the phone number to an E .164 format.
    otp = models.CharField(max_length=1000, null=True, blank=True)
    reset_token  = models.CharField(max_length=1000, null=True, blank=True)
    
    USERNAME_FIELD = 'email' # Sets 'email' as the unique identifier for login instead of 'username'.
    REQUIRED_FIELDS = ['username'] # Fields required when creating a user via createsuperuser (excluding USERNAME_FIELD and password).
    
    def __str__(self): # Defines how the user object is displayed (e.g. in admin or logs).
        return self.email  # Shows the user's email as its string representation.
    
    def __unicode__(self):# For Python 2: returns a Unicode string representation of the user object.
        return self.username ## Displays the username when the object is printed.
    
    def save(self, *args, **kwargs):  # Customizes model saving behavior before writing to the database.
        # we need to look for a way to handle the creation of the username from the email
        email_username, domain = self.email.split('@')  # Splits email into two parts, email_username and domain
        
        if self.full_name == "" or self.full_name is None:
            self.full_name = self.email  # Sets full_name to email if it's empty or missing.
        if self.username == "" or self.username is None:
            self.username = email_username  # Sets username to the part before '@' if not provided.
        super(User, self).save(*args, **kwargs)  # Calls the original save method to complete saving.
# You're using Django's `AbstractUser` to create a custom user model, and you've set `email` as the primary 
# identifier for authentication by assigning it to `USERNAME_FIELD`. This is a common and modern approach, 
# especially since email addresses are unique and more intuitive for users to remember than usernames. 
# Given this setup, the inclusion of the `username` field becomes questionable. If you're not using it for display
# purposes or compatibility with third-party packages, it's essentially redundant. You can safely remove the 
# `username` field and also eliminate it from the `REQUIRED_FIELDS` list, which is only necessary when creating
# users via the command line or admin interface.
# Another unnecessary part of the code is the `__unicode__()` method. This was relevant in Python 2, but in
# Python 3 and Django 3+, the `__str__()` method is the standard way to define how an object is represented as
# a string. Since you're already using `__str__()` to return the user's email, you can delete the `__unicode__()`
# method entirely.
# In your `save()` method, you're splitting the email to extract the part before the `@` symbol and assigning it
# to `username` if it's not already set. However, if you're removing the `username` field, this logic becomes
# unnecessary. Also, the variable name `file` used for the domain part of the email is misleading—renaming it 
# to something like `domain` would make the code clearer if you ever need to use it.
# Overall, your instincts are correct: if you're authenticating users via email and don't need a separate 
# username for display or legacy reasons, it's best to simplify the model by removing it. 
# This makes your code cleaner, easier to maintain, and more aligned with modern authentication practices.
#Why People Sometimes Keep username:- Displaying a short handle or nickname,
# Compatibility with third-party packages expecting a username field, Admin readability
################################################################################################

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    #In Django, model relationships are defined using fields like `OneToOneField`, `ForeignKey`, and 
    # `ManyToManyField`, each serving a specific purpose. A `OneToOneField` creates a direct link between two 
    # models where each instance of one model corresponds to exactly one instance of the other—commonly used for 
    # extending the built-in `User` model with a custom profile. A `ForeignKey` establishes a many-to-one 
    # relationship, meaning multiple instances of one model can be related to a single instance of another; 
    # for example, many blog posts can be authored by one user. The `ManyToManyField` allows for a flexible 
    # relationship where each instance of a model can be associated with multiple instances of another model 
    # and vice versa—ideal for tagging systems where posts can have multiple tags and tags can belong to multiple 
    # posts. Additionally, these fields often include an `on_delete` argument to define behavior when the 
    # related object is deleted. Options include `CASCADE` (delete related objects), `PROTECT` (prevent deletion),
    # `SET_NULL` (set reference to null), `SET_DEFAULT` (set to a default value), and `DO_NOTHING` 
    # (take no action, which may cause integrity issues). Each choice affects how your data behaves and 
    # should be selected based on your app’s logic and data integrity needs.
    image = models.ImageField(upload_to='accounts/users', default='default/default-user.jpg',
                              null=True, blank=True)
    #upload_to='accounts/users' just tells Django where to store uploaded images relative to your MEDIA_ROOT. 
    # You need to make sure the accounts/users and default folders exist inside your media directory, or Django
    # will raise an error when trying to save files.
    full_name = models.CharField(max_length=1000, null=True, blank=True)
    about = models.TextField( null=True, blank=True)
    
    gender = models.CharField(max_length=500, choices=GENDER, null=True, blank=True)
    country = models.CharField(max_length=1000, null=True, blank=True)
    city = models.CharField(max_length=500, null=True, blank=True)
    state = models.CharField(max_length=500, null=True, blank=True)
    address = models.CharField(max_length=1000, null=True, blank=True)
    newsletter = models.BooleanField(default=False)
    # wishlist = models.ManyToManyField("store.Product", blank=True)
    type = models.CharField(max_length=500, choices=GENDER, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    pid = ShortUUIDField(unique=True, length=10, max_length=20, alphabet="abcdefghijklmnopqrstuvxyz")#profile id
    #don't use id field as id is reserved by django for default id field, you can use id if you want to override it
    
    class Meta:#Defines model’s default sort order — here, newest entries (date descending) appear 
        ordering = ["-date"] #first when querying the database.
    def __str__(self):
        if self.full_name:
            return str(self.full_name)
#Wrapping self.full_name in str() ensures the return value is explicitly a string, even if full_name is another
# type (like int, None, or a custom object). It’s a safe way to avoid errors when Django calls __str__()—which
# must return a string—especially if full_name might vary or be dynamically set.
        else:
            return str(self.user.full_name)
        
    def save(self, *args, **kwargs):
        if self.full_name == "" or self.full_name == None:
             self.full_name = self.user.full_name
        super(Profile, self).save(*args, **kwargs)#This calls the parent class (models.Model)’s save() method to 
#ensure Django handles saving the model instance correctly. It preserves built-in behavior like writing to the 
# database, triggering signals, and updating timestamps. Essential when overriding save() to add custom logic 
# before or after saving.
    def thumbnail(self):
        return mark_safe('<img src="/media/%s" width="50" height="50" object-fit:"cover" style="border-radius: 30px; object-fit: cover;" />' % (self.image))
#Defines a method that returns an HTML <img> tag showing the model’s image as a 50×50 thumbnail with rounded 
# corners. mark_safe ensures Django doesn’t escape the HTML, so it renders properly in templates or admin. 
# Useful for displaying profile pictures or previews in the admin panel.    
    
    
#It should be not inside class block
def create_user_profile(sender, instance, created, **kwargs):
	if created:
		Profile.objects.create(user=instance)
#sender: The model class that triggered the signal — e.g., User if you're listening for user creation.
#instance: The actual model object that was saved — e.g., the specific User instance just created.
#created: A boolean — True if the object was just created (not updated). Helps you run logic only on new records.
#A function which  checks if a new User was created, and if so, it auto-generates a linked Profile. 
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()#This signal handler saves the related Profile whenever the User instance is saved. 
#It ensures that changes to the user (like username or email) trigger a save on the linked profile too—useful 
# if the profile depends on user data or needs syncing.

post_save.connect(create_user_profile, sender=User)
#connects the create_user_profile function to Django’s post_save signal for the User model. It means: 
# every time a User is saved, Django will check if it’s newly created, and if so, run create_user_profile()
# to automatically create a linked Profile. This is how you hook custom logic into model lifecycle events.
post_save.connect(save_user_profile, sender = User)
#connects the save_user_profile function to the post_save signal of the User model. It ensures that every 
# time a User is saved, the linked Profile is also saved—keeping both models in sync, especially useful if 
# the profile depends on updated user data.

#################
#Error
#ERRORS:
# auth.User.groups: (fields.E304) Reverse accessor 'Group.user_set' for 'auth.User.groups' clashes with
# reverse accessor for 'userauth.User.groups'
#Just set AUTH_USER_MODEL in settings.py
##################
#while running migrate
# raise InconsistentMigrationHistory(
#django.db.migrations.exceptions.InconsistentMigrationHistory: Migration admin.0001_initial is applied before
# its dependency userauth.0001_initial on database 'default'.
#Just comment out 'jazzmin','django.contrib.admin', in settings.py and path('admin/', admin.site.urls),
#in urls.py. Then run migrate, un comment
#Why?
#It works but why?

#This issue occurs because Django migrations rely on a specific order of dependencies between apps. 
# When admin.0001_initial is applied before its dependency userauth.0001_initial, Django raises an 
# InconsistentMigrationHistory error. This typically happens when the admin app is loaded before userauth, 
# causing its migration to run prematurely and break the expected dependency chain. By commenting out 
# 'django.contrib.admin' and its corresponding URL path, you temporarily remove the admin app from Django’s 
# app registry, preventing its migrations from being applied too early. Running migrate at this point allows
# Django to apply migrations in the correct order, starting with userauth. Once that’s done, you can safely 
# uncomment the admin app and run the server, because the migration dependencies are now properly resolved.
# This workaround essentially lets you manually control the migration order when Django’s automatic handling
# doesn’t behave as expected.

#This issue may not necessarily occur in future migrations, but it can reappear depending on how your apps and 
# their relationships evolve. Django migrations typically depend only on the last migration of their own app, 
# but if you reference models or fields from another app—like using a foreign key to `userauth` in `admin`—Django
# may automatically create a cross-app dependency. If the app loading order causes the dependent app to migrate
# before its prerequisite, Django will raise the same `InconsistentMigrationHistory` error. To avoid this, it's 
# important to maintain a consistent migration workflow, be cautious with cross-app references, and preview
# migration plans using tools like `--plan`. While future migrations are usually safe, any structural change
#involving multiple apps can potentially trigger this issue again, so a bit of vigilance is key.