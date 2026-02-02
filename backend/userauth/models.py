from django.db import models
from shortuuid.django_fields import ShortUUIDField
from django.db.models.signals import post_save
from django.utils.html import mark_safe
from django.core.validators import RegexValidator
from django.utils.text import gettext_lazy as _
from django.contrib.auth.models import AbstractUser
from decimal import Decimal

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
        filename = "%s.%s" % (user.id, ext)
        return 'user_{0}/{1}'.format(user.id, filename)
    else:
        ext = filename.split('.')[-1]
        filename = "%s.%s" % ('file', ext)
        return 'user_{0}/{1}'.format('file', filename)

class User(AbstractUser):
    username = models.CharField(max_length=500, null=True, blank=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=500, null=True, blank=True)
    phone = models.CharField(max_length=20)
    otp = models.CharField(max_length=1000, null=True, blank=True)
    reset_token = models.CharField(max_length=1000, null=True, blank=True)
    email_verified = models.BooleanField(default=False)  # New field for email verification
    pending_email = models.EmailField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def __unicode__(self):
        return self.username

    def save(self, *args, **kwargs):
        email_username, domain = self.email.split('@')
        if self.full_name == "" or self.full_name is None:
            self.full_name = self.email
        if self.username == "" or self.username is None:
            self.username = email_username
        super(User, self).save(*args, **kwargs)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='accounts/users', default='default/default-user.jpg', null=True, blank=True)
    full_name = models.CharField(max_length=1000, null=True, blank=True)
    about = models.TextField(null=True, blank=True)
    gender = models.CharField(max_length=500, choices=GENDER, null=True, blank=True)
    country = models.CharField(max_length=1000, null=True, blank=True)
    city = models.CharField(max_length=500, null=True, blank=True)
    state = models.CharField(max_length=500, null=True, blank=True)
    address = models.CharField(max_length=1000, null=True, blank=True)
    postal_code = models.CharField(max_length=6, null=True, blank=True, validators=[RegexValidator('^[0-9]{6}$', _('Invalid postal code'))])
    newsletter = models.BooleanField(default=False)
    type = models.CharField(max_length=500, choices=GENDER, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    pid = ShortUUIDField(unique=True, length=10, max_length=20, alphabet="abcdefghijklmnopqrstuvxyz")

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        if self.full_name:
            return str(self.full_name)
        else:
            return str(self.user.full_name)

    def save(self, *args, **kwargs):
        if self.full_name == "" or self.full_name is None:
            self.full_name = self.user.full_name
        super(Profile, self).save(*args, **kwargs)

    def thumbnail(self):
        return mark_safe('<img src="/media/%s" width="50" height="50" object-fit:"cover" style="border-radius: 30px; object-fit: cover;" />' % (self.image))

def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)



class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='INR')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.balance} {self.currency}"

    def deposit(self, amount, transaction_type='deposit', description='', related_order=None, related_order_item=None):
        """Deposit amount to wallet and create transaction record."""
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.balance += Decimal(str(amount))
        self.save()
        
        # Create transaction record
        WalletTransaction.objects.create(
            wallet=self,
            transaction_type=transaction_type,
            amount=Decimal(str(amount)),
            balance_after=self.balance,
            description=description,
            related_order=related_order,
            related_order_item=related_order_item
        )
        return self.balance

    def withdraw(self, amount, transaction_type='withdrawal', description='', related_order=None, related_order_item=None):
        """Withdraw amount from wallet and create transaction record."""
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if self.balance < Decimal(str(amount)):
            raise ValueError("Insufficient balance")
        self.balance -= Decimal(str(amount))
        self.save()
        
        # Create transaction record
        WalletTransaction.objects.create(
            wallet=self,
            transaction_type=transaction_type,
            amount=Decimal(str(amount)),
            balance_after=self.balance,
            description=description,
            related_order=related_order,
            related_order_item=related_order_item
        )
        return self.balance


class WalletTransaction(models.Model):
    """Model to track all wallet transactions."""
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('refund', 'Refund'),
        ('payment', 'Payment'),
    ]
    
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Reference to related order (for refunds/payments)
    related_order = models.ForeignKey(
        'store.CartOrder', 
        null=True, blank=True, 
        on_delete=models.SET_NULL,
        related_name='wallet_transactions'
    )
    related_order_item = models.ForeignKey(
        'store.CartOrderItem', 
        null=True, blank=True, 
        on_delete=models.SET_NULL,
        related_name='wallet_transactions'
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.wallet.user.email} - {self.transaction_type} - ₹{self.amount}"
    
    @property
    def transaction_id(self):
        """Generate a readable transaction ID."""
        return f"TXN{self.id:08d}"


# === Wallet Signals  ===
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(user=instance)

def save_user_wallet(sender, instance, **kwargs):
    try:
        instance.wallet.save()
    except Wallet.DoesNotExist:
        Wallet.objects.create(user=instance)

post_save.connect(create_user_wallet, sender=User)
post_save.connect(save_user_wallet, sender=User)