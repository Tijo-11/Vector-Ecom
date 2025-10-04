from django.db import models 
import os
import uuid
from shortuuid.django_fields import ShortUUIDField 
from django.utils import timezone

from django.db.models.signals import post_save

from django.utils.html import mark_safe
from django.core.validators import RegexValidator
from django.utils.text import gettext_lazy as _

from django.contrib.auth.models import AbstractUser
GENDER = (
    ("female", "Female"),
    ("male", "Male"),
    ("others", "Others")
)

def user_directory_path(instance, filename):
    user = None
    
    if hasattr(instance, 'user') and instance.user:

        user = instance.user
    elif hasattr(instance, 'vendor') and hasattr(instance.vendor, 'user') and instance.vendor.user:
        user = instance.vendor.user
    elif hasattr(instance, 'product') and hasattr(instance.product.vendor, 'user') and instance.product.vendor.user:
        user = instance.product.vendor.user

    if user:
        ext = filename.split('.')[-1]
        # - Extract file extension from original filename
        filename = "%s.%s" % (user.id, ext)
        # - Rename file to <user_id>.<ext> for uniqueness
        return 'user_{0}/{1}'.format(user.id, filename)
    # - Return path: user_<user_id>/<user_id>.<ext>
    else:
        ext = filename.split('.')[-1]
        filename = "%s.%s" % ('file', ext)
        return 'user_{0}/{1}'.format('file', filename)

# Create your models here.
class User(AbstractUser):
    username = models.CharField(max_length=500, null=True, blank=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=500, null=True, blank=True)
    phone = models.CharField(max_length=20) # a lot of countries have their own different way of# actually 
    
    otp = models.CharField(max_length=1000, null=True, blank=True)
    reset_token  = models.CharField(max_length=1000, null=True, blank=True)
    
    USERNAME_FIELD = 'email' # Sets 'email' as the unique identifier for login instead of 'username'.
    REQUIRED_FIELDS = ['username'] # Fields required when creating a user via createsuperuser (excluding USERNAME_FIELD and password).
    
    def __str__(self): 
        return self.email  
    
    def __unicode__(self):# For Python 2: returns a Unicode string representation of the user object.
        return self.username ## Displays the username when the object is printed.
    
    def save(self, *args, **kwargs):  # Customizes model saving behavior before writing to the database.
        # we need to look for a way to handle the creation of the username from the email
        email_username, domain = self.email.split('@')  # Splits email into two parts, email_username and domain
        
        if self.full_name == "" or self.full_name is None:
            self.full_name = self.email  # Sets full_name to email if it's empty or missing.
        if self.username == "" or self.username is None:
            self.username = email_username  # Sets username to the part before '@' if not provided.
        super(User, self).save(*args, **kwargs)  #
################################################################################################

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
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
    postal_code = models.CharField(
        max_length=6,null=True, blank=True,
        validators=[RegexValidator('^[0-9]{6}$', _('Invalid postal code'))],
    )
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

        else:
            return str(self.user.full_name)
        
    def save(self, *args, **kwargs):
        if self.full_name == "" or self.full_name == None:
             self.full_name = self.user.full_name
        super(Profile, self).save(*args, **kwargs)
    def thumbnail(self):
        return mark_safe('<img src="/media/%s" width="50" height="50" object-fit:"cover" style="border-radius: 30px; object-fit: cover;" />' % (self.image))
#Defines a method that returns an HTML <img> tag showing the model’s image as a 50×50 thumbnail with rounded 
# corners. mark_safe ensures Django doesn’t escape the HTML, so it renders properly in templates or admin. 
# Useful for displaying profile pictures or previews in the admin panel.    
    
    
#It should be not inside class block
def create_user_profile(sender, instance, created, **kwargs):
	if created:
		Profile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

post_save.connect(create_user_profile, sender=User)
