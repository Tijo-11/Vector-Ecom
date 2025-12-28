from .choices import CANCELLATION_REASON_CHOICES, RETURN_REASON_CHOICES
from django.db import models
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
    order_item = models.OneToOneField(CartOrderItem, on_delete=models.CASCADE)
    returned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    reason = models.CharField(max_length=100, choices=RETURN_REASON_CHOICES)
    reason_detail = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=50,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )

    def __str__(self):
        return f"Return for Item {self.order_item.oid}"

    def approve(self):
        """Approve return and restore stock"""
        if self.status == 'pending':
            self.status = 'approved'
            self.save()
            product = self.order_item.product
            product.stock_qty += self.order_item.qty
            product.save()
    
    
    
    