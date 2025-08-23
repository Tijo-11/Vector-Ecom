from django.db import models
from shortuuid.django_fields import ShortUUIDField
from django.utils.html import mark_safe
from userauth.models import User, user_directory_path, Profile
from store import models as store_model
from django.db.models import Max
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
import shortuuid

IDENTITY_TYPE = (
    ("national_id_card", "National ID Card"),
    ("drivers_licence", "Drives Licence"),
    ("international_passport", "International Passport")
)

GENDER = (
    ("male", "Male"),
    ("female", "Female"),
)

CURRENCY = (
    ("USD", "USD"),
    ("EUR", "EUR"),
    ("GBP", "GBP"),
)

NOTIFICATION_TYPE = (
    ("new_order", "New Order"),
    ("new_offer", "New Offer"),
    ("new_bidding", "New Bidding"),
    
    ("item_arrived", "Item Arrived"),
    ("item_shipped", "Item Shipped"),
    ("item_delivered", "Item Delivered"),
    
    ("tracking_id_added", "Tracking ID Added"),
    ("tracking_id_changed", "Tracking ID Changed"),
    
    ("offer_rejected", "Offer Rejected"),
    ("offer_accepted", "Offer Accepted"),
    
    ("update_offer", "Update Offer"),
    ("update_bid", "Update Bid"),

    ("order_cancelled", "Order Cancelled"),
    ("order_cancel_request", "Order Cancel Request"),

    ("new_review", "New Review"),
    ("noti_new_faq", "New Product Question"),



    ("Bidding Won", "Bidding Won"),
    
    ("product_published", "Product Published"),
    ("product_rejected", "Product Rejected"),
    ("product_disabled", "Product Disabled"),
)

PAYOUT_METHOD = (
    ("payout_to_paypal", "Payout to Paypal"),
    # ("payout_to_stripe", "Payout to Stripe"),
    # ("payout_to_wallet", "Payout to Wallet"),
)

DISCOUNT_TYPE = (
    ("Percentage", "Percentage"),
    ("Flat Rate", "Flat Rate"),
)

# Create your models here.

class Vendor(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, related_name="vendor")
    image = models.ImageField(upload_to=user_directory_path, default="shop-image.jpg", blank=True)
    name = models.CharField(max_length=100, help_text="Shop Name", null=True, blank=True)
    email = models.EmailField(max_length=100, help_text="Shop Email", null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    mobile = models.CharField(max_length = 150, null=True, blank=True)
    verified = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    vid = ShortUUIDField(unique=True, length=10, max_length=20, alphabet="abcdefghijklmnopqrstuvxyz")
    date = models.DateTimeField(auto_now_add=True)
    slug = models.SlugField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Vendors"

    def vendor_image(self):
        return mark_safe('  <img src="%s" width="50" height="50" style="object-fit:cover; border-radius: 6px;" />' % (self.shop_image.url))

    def __str__(self):
        return str(self.name)
        

    def save(self, *args, **kwargs):
        if self.slug == "" or self.slug == None:
            self.slug = slugify(self.name)
        super(Vendor, self).save(*args, **kwargs) 


'''
Callable default on unique field vendor.vid will not generate unique values upon migrating. 
Please choose how to proceed: 1) Continue making this migration as the first step in writing a manual 
migration to generate unique values described here:
https://docs.djangoproject.com/en/5.2/howto/writing-migrations/#migrations-that-add-unique-fields. 
2)
Quit and edit field options in models.py. Select an option: 

🔍 **Explanation:**  
This error occurs because you're adding a **unique field** (`vendor.vid`) with a **callable default** (like `uuid.uuid4`) during a migration. Django needs to populate existing rows in the database with default values — but it calls the default **only once**, meaning **all rows get the same value**, which violates the uniqueness constraint.

🛠️ **Your options:**

- **Option 1:** Proceed with the migration, then write a **manual data migration** to assign unique values to each row individually. This is the recommended approach for existing data.  
- **Option 2:** Edit `models.py` to remove `unique=True` temporarily or avoid using a callable default. You can later reintroduce uniqueness after populating the field.

💡 **Best practice:**  
Use `null=True` initially, run the migration, then write a data migration to fill in unique values (e.g., using `uuid.uuid4()` per row), and finally make the field `unique=True` and `null=False`.

Want help writing that manual migration? I can whip it up for you.
'''