from .choices import CANCELLATION_REASON_CHOICES, RETURN_REASON_CHOICES
from django.db import models
from django.utils import timezone
from userauth.models import User
from .order import  CartOrder, CartOrderItem#, Cart, CancelOrder, Coupon, CouponUsers, DeliveryCountries

class OrderCancellation(models.Model):
    order = models.ForeignKey(CartOrder, on_delete=models.CASCADE, related_name = 'cancellations')
    cancelled_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    reason = models.CharField(max_length=100, choices=CANCELLATION_REASON_CHOICES)
    reason_detail= models.TextField(blank=True, null=True)
    cancelled_at = models.DateTimeField(auto_now_add=True)
    is_full_order = models.BooleanField(default=False)
    items = models.ManyToManyField(CartOrderItem, blank=True)
    
    def __str__(self):
        return f"Cancellation for Order {self.order.oid}"
    
    def restore_stock(self):
        """Restore stock for cancelled items"""
        import logging
        log = logging.getLogger(__name__)
        
        items_to_restore = self.items.all() if not self.is_full_order else self.order.orderitem.all()
        log.info(f"Restoring stock for cancellation {self.id}. is_full_order={self.is_full_order}")
        log.info(f"Items to restore count: {items_to_restore.count()}")
        
        for item in items_to_restore:
            product = item.product
            old_stock = product.stock_qty
            product.stock_qty += item.qty
            product.save()
            log.info(f"Restored stock for product {product.title} (ID: {product.id}): {old_stock} + {item.qty} = {product.stock_qty}")
            
class OrderReturn(models.Model):
    RETURN_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    order_item = models.OneToOneField(CartOrderItem, on_delete=models.CASCADE, related_name='orderreturn')
    returned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    reason = models.CharField(max_length=100, choices=RETURN_REASON_CHOICES)
    reason_detail = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=RETURN_STATUS_CHOICES, default='pending')
    vendor_response_note = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Return for Item {self.order_item.oid}"

    def approve(self, note=''):
        """Approve return and restore stock"""
        if self.status == 'pending':
            self.status = 'approved'
            self.vendor_response_note = note
            self.processed_at = timezone.now()
            self.save()
            # Update delivery status to Returning
            self.order_item.delivery_status = "Returning"
            self.order_item.save()
            # Restore stock
            product = self.order_item.product
            product.stock_qty += self.order_item.qty
            product.save()
    
    def reject(self, note=''):
        """Reject return request"""
        if self.status == 'pending':
            self.status = 'rejected'
            self.vendor_response_note = note
            self.processed_at = timezone.now()
            self.save()
            # Keep delivery status as Delivered
            self.order_item.delivery_status = "Delivered"
            self.order_item.save()
