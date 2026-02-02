from store.models import CartOrder, CartOrderItem, CancelledOrder, Notification
from userauth.models import WalletTransaction
from store.models import OrderReturn
from django.core.management.base import BaseCommand

# Clear Wallet Transactions
print("Deleting Wallet Transactions...")
WalletTransaction.objects.all().delete()

# Clear Order Returns
print("Deleting Order Returns...")
OrderReturn.objects.all().delete()

# Clear Cancelled Orders
print("Deleting Cancelled Order records...")
CancelledOrder.objects.all().delete()

# Clear Notifications related to orders
print("Deleting Notifications...")
Notification.objects.all().delete()

# Clear Cart Orders (cascades to CartOrderItems)
print("Deleting Cart Orders...")
CartOrder.objects.all().delete()

# Clear Cart Order Items (cleanup)
print("Deleting Cart Order Items...")
CartOrderItem.objects.all().delete()

print("All order data cleared successfully!")
