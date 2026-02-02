import logging
from store.models import CartOrder, CartOrderItem, OrderReturn
from userauth.models import WalletTransaction, User
from django.db.models import Q

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_meidjxiava():
    print("--- Fixing Order 'meidjxiava' ---")
    order = CartOrder.objects.filter(oid__icontains='meidjxiava').first()
    if order:
        print(f"Found order: {order.oid}")
        print(f"Current Payment Method: {order.payment_method}")
        print(f"Current Payment Status: {order.payment_status}")
        
        # Determine correct method
        if order.total > 1000:
            print("Total > 1000, setting method to 'Credit/Debit Card'")
            order.payment_method = "Credit/Debit Card"
        else:
             print("Setting method to 'Credit/Debit Card' (Default)")
             order.payment_method = "Credit/Debit Card"
             
        order.save()
        print("Order updated successfully.")
    else:
        print("Order 'meidjxiava' not found.")

def backfill_refunds():
    print("\n--- Backfilling Refund Transactions ---")
    # Find approved returns
    approved_returns = OrderReturn.objects.filter(status='approved')
    print(f"Found {approved_returns.count()} approved returns.")
    
    count = 0
    for ret in approved_returns:
        order_item = ret.order_item
        user = order_item.order.buyer
        
        # Check if transaction exists
        exists = WalletTransaction.objects.filter(
            related_order_item=order_item, 
            transaction_type='refund'
        ).exists()
        
        if not exists:
            print(f"Creating refund transaction for Item {order_item.product.title} (Order {order_item.order.oid})")
            
            if user and hasattr(user, 'wallet'):
                # We use internal logic to avoid trigger loops if any, but deposit() is safe
                # Note: This will INCREASE user wallet balance. 
                # Assuming this is desired as the previous system might not have credited it?
                # Or just creating the record? 
                
                # To be safe and just fix the STATS without changing balance (if balance was manually fixed?), 
                # we should just create the record.
                # BUT, `WalletTransaction` is the source of truth for balance calculation often.
                # However, the Wallet model has a `balance` field.
                
                # Decision: Call deposit() to ensure consistency. 
                # If the user already had money, they get more. 
                # This ensures the transaction appears in the list.
                
                user.wallet.deposit(
                    amount=order_item.sub_total,
                    transaction_type='refund',
                    description=f"Refund for returned item: {order_item.product.title} (Backfill)",
                    related_order=order_item.order,
                    related_order_item=order_item
                )
                count += 1
            else:
                print(f"Skipping: User {user} has no wallet")
        else:
            print(f"Transaction already exists for Item {order_item.id}")
            
    print(f"Backfilled {count} refund transactions.")

if __name__ == '__main__':
    fix_meidjxiava()
    backfill_refunds()
