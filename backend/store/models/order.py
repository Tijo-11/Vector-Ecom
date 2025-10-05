#Cart, CartOrder, CartOrderItem, CancelOrder, Coupon, CouponUsers, DeliveryCountries


from django.db import models 
from django.utils.html import mark_safe 
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator 
from userauth.models import User
from vendor.models import Vendor 
from shortuuid.django_fields import ShortUUIDField
from .product import Product
from .choices import PAYMENT_STATUS, ORDER_STATUS, DELIVERY_STATUS
from django.core.validators import RegexValidator
from django.utils.text import gettext_lazy as _

class Cart(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    qty = models.PositiveIntegerField(default=0, null=True, blank=True)
    price = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, null=True, blank=True)
    sub_total = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, null=True, blank=True)
    shipping_amount = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, null=True, blank=True)
    service_fee = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, null=True, blank=True)
    tax_fee = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, null=True, blank=True)
    total = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    size = models.CharField(max_length=100, null=True, blank=True)
    color = models.CharField(max_length=100, null=True, blank=True)
    cart_id = models.CharField(max_length=1000, null=True, blank=True, db_index=True)
    date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, help_text="True if cart is unplaced/active; False if converted to order")
    def __str__(self):
        return f'{self.cart_id} - {self.product.title}'
    #Including product.title helps quickly recognize what item is in the cart, especially when multiple carts
    # exist — improves readability and debugging.
    
# Model for Cart Orders
class CartOrder(models.Model):
    # Vendors associated with the order
    vendor = models.ManyToManyField(Vendor, blank=True)
    # Buyer of the order
    buyer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="buyer", blank=True)
    # Total price of the order
    sub_total = models.DecimalField(default=0.00, max_digits=12, decimal_places=2)
    # Shipping cost
    shipping_amount = models.DecimalField(default=0.00, max_digits=12, decimal_places=2)
    # Tax cost
    tax_fee = models.DecimalField(default=0.00, max_digits=12, decimal_places=2)
    # Service fee cost
    service_fee = models.DecimalField(default=0.00, max_digits=12, decimal_places=2)
    # Total cost of the order
    total = models.DecimalField(default=0.00, max_digits=12, decimal_places=2)
    
    # Order status attributes
    payment_status = models.CharField(max_length=100, choices=PAYMENT_STATUS, default="initiated")
    order_status = models.CharField(max_length=100, choices=ORDER_STATUS, default="Pending")
    # Discounts
    initial_total = models.DecimalField(default=0.00, max_digits=12, decimal_places=2, help_text="The original total before discounts")
    #helptext is # Tooltip shown in admin panel for clarity on field purpose
    #help_text improves usability in Django admin/forms by explaining what the field represents — especially useful for non-developers managing data.
    saved = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True, help_text="Amount saved by customer")
    # Optional field showing how much the customer saved; null in DB, blank in forms; tooltip for admin
    
    # Personal Informations
    full_name = models.CharField(max_length=1000)
    email = models.CharField(max_length=1000)
    mobile = models.CharField(max_length=1000)
    
    # Shipping Address
    address = models.CharField(max_length=1000, null=True, blank=True)
    city = models.CharField(max_length=1000, null=True, blank=True) # use it instead of zip_code
    state = models.CharField(max_length=1000, null=True, blank=True)
    country = models.CharField(max_length=1000, null=True, blank=True)
    postal_code = models.CharField(
        max_length=10,null=True, blank=True,
        validators=[RegexValidator('^[0-9]{6}$', _('Invalid postal code'))],
    )
    
    coupons = models.ManyToManyField('store.Coupon', blank=True)
    
    
    razorpay_session_id = models.CharField(max_length=200,null=True, blank=True)# Stores Razorpay order ID
    oid = ShortUUIDField(length=10, max_length=25, alphabet="abcdefghijklmnopqrstuvxyz")
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["-date"]
        verbose_name_plural = "Cart Order"
        
    def __str__(self):
        return self.oid
    def get_order_items(self):
        return CartOrderItem.objects.filter(order=self)
    
# Define a model for Cart Order Item
class CartOrderItem(models.Model):
    # A foreign key relationship to the CartOrder model with CASCADE deletion
    order = models.ForeignKey(CartOrder, on_delete=models.CASCADE, related_name="orderitem")
    # A foreign key relationship to the Product model with CASCADE deletion
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="order_item")
    # Integer field to store the quantity (default is 0)
    qty = models.IntegerField(default=0)
    # Fields for color and size with max length 100, allowing null and blank values
    color = models.CharField(max_length=100, null=True, blank=True)
    size = models.CharField(max_length=100, null=True, blank=True)
    # Decimal fields for price, total, shipping, VAT, service fee, grand total, and more
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Total of Product price * Product Qty")
    shipping_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Estimated Shipping Fee = shipping_fee * total")
    tax_fee = models.DecimalField(default=0.00, max_digits=12, decimal_places=2, help_text="Estimated Vat based on delivery country = tax_rate * (total + shipping)")
    service_fee = models.DecimalField(default=0.00, max_digits=12, decimal_places=2, help_text="Estimated Service Fee = service_fee * total (paid by buyer to platform)")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Grand Total of all amount listed above")
    
    
    expected_delivery_date_from = models.DateField(auto_now_add=False, null=True, blank=True)
    expected_delivery_date_to = models.DateField(auto_now_add=False, null=True, blank=True)


    initial_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Grand Total of all amount listed above before discount")
    saved = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True, help_text="Amount saved by customer")
    
    # Order stages
    order_placed = models.BooleanField(default=False)
    processing_order = models.BooleanField(default=False)
    quality_check = models.BooleanField(default=False)
    product_shipped = models.BooleanField(default=False)
    product_arrived = models.BooleanField(default=False)
    product_delivered = models.BooleanField(default=False)

    # Various fields for delivery status, delivery couriers, tracking ID, coupons, and more
    delivery_status = models.CharField(max_length=100, choices=DELIVERY_STATUS, default="On Hold")
    delivery_couriers = models.ForeignKey("store.DeliveryCouriers", on_delete=models.SET_NULL, null=True, blank=True)
    tracking_id = models.CharField(max_length=100000, null=True, blank=True)
    
    coupon = models.ManyToManyField("store.Coupon", blank=True)
    applied_coupon = models.BooleanField(default=False)
    oid = ShortUUIDField(length=10, max_length=25, alphabet="abcdefghijklmnopqrstuvxyz")
    # A foreign key relationship to the Vendor model with SET_NULL option
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name_plural = "Cart Order Item"
        ordering = ["-date"]
        
    # Method to generate an HTML image tag for the order item
    def order_img(self):
        return mark_safe('<img src="%s" width="50" height="50" style="object-fit:cover; border-radius: 6px;" />' % (self.product.image.url))
   
    # Method to return a formatted order ID
    def order_id(self):
        return f"Order ID #{self.order.oid}"
    
    # Method to return a string representation of the object
    def __str__(self):
        return self.oid
    
    
# Define a model for Cancelled Order
class CancelledOrder(models.Model):
    # A foreign key relationship to the User model with CASCADE deletion
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    # A foreign key relationship to the CartOrderItem model with SET_NULL option, allowing null values
    orderitem = models.ForeignKey("store.CartOrderItem", on_delete=models.SET_NULL, null=True)
    # Field for email with max length 100
    email = models.CharField(max_length=100)
    # Boolean field for the refunded status
    refunded = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = "Cancelled Order"
    
    # Method to return a string representation of the object
    def __str__(self):
        if self.user:
            return str(self.user.username)
        else:
            return "Cancelled Order"

# Define a model for Coupon
class Coupon(models.Model):
    # A foreign key relationship to the Vendor model with SET_NULL option, allowing null values, and specifying a related name
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, related_name="coupon_vendor")
    # Many-to-many relationship with User model for users who used the coupon
    used_by = models.ManyToManyField(User, blank=True)
    # Fields for code, type, discount, redemption, date, and more
    code = models.CharField(max_length=1000)
    # type = models.CharField(max_length=100, choices=DISCOUNT_TYPE, default="Percentage")
    discount = models.IntegerField(default=1, validators=[MinValueValidator(0), MaxValueValidator(100)])
    # redemption = models.IntegerField(default=0)
    date = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)
    # make_public = models.BooleanField(default=False)
    # valid_from = models.DateField()
    # valid_to = models.DateField()
    # ShortUUID field
    cid = ShortUUIDField(length=10, max_length=25, alphabet="abcdefghijklmnopqrstuvxyz")
    
    # Method to calculate and save the percentage discount
    def save(self, *args, **kwargs):
        new_discount = int(self.discount) / 100
        self.get_percent = new_discount
        super(Coupon, self).save(*args, **kwargs) 
    
    # Method to return a string representation of the object
    def __str__(self):
        return self.code
    
    class Meta:
        ordering =['-id']

# Define a model for Coupon Users
class CouponUsers(models.Model):
    # A foreign key relationship to the Coupon model with CASCADE deletion
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE)
    # A foreign key relationship to the CartOrder model with CASCADE deletion
    order = models.ForeignKey(CartOrder, on_delete=models.CASCADE)
    # Fields for full name, email, and mobile
    full_name = models.CharField(max_length=1000)
    email = models.CharField(max_length=1000)
    mobile = models.CharField(max_length=1000)
    
    # Method to return a string representation of the coupon code
    def __str__(self):
        return str(self.coupon.code)
    
    class Meta:
        ordering =['-id']

# Define a model for Delivery Couriers
class DeliveryCouriers(models.Model):
    name = models.CharField(max_length=1000, null=True, blank=True)
    tracking_website = models.URLField(null=True, blank=True)
    url_parameter = models.CharField(null=True, blank=True, max_length=100)
    
    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Delivery Couriers"
    
    def __str__(self):
        return self.name
    
    
