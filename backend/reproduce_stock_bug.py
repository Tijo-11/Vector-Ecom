
import os
import sys
from unittest.mock import MagicMock

# Mock celery before importing Django
sys.modules["celery"] = MagicMock()
sys.modules["celery.schedules"] = MagicMock()
sys.modules["kombu"] = MagicMock()

import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings') # Adjust based on actual settings path
django.setup()

from store.models import Product, CartOrderItem, CartOrder, Vendor
from userauth.models import User

# Mock logger
import logging
logger = logging.getLogger(__name__)

class MockView:
    def deduct_stock(self, order_items):
        """Decrease product stock after successful payment."""
        for item in order_items:
            product = item.product
            # LOGIC FROM checkout_views.py
            if product.stock_qty >= item.qty:
                product.stock_qty -= item.qty
                product.save()
                print(f"Stock updated: {product.title} -{item.qty}")
            else:
                print(f"Insufficient stock for {product.title} during payment success.")

def reproduce():
    print("Setting up test data...")
    # Create dummy user and vendor
    user, _ = User.objects.get_or_create(username='testuser', email='test@example.com')
    vendor, _ = Vendor.objects.get_or_create(user=user, title="Test Vendor")
    
    # Create product with initial stock
    initial_stock = 10
    product, _ = Product.objects.get_or_create(
        title="Test Product",
        defaults={
            'stock_qty': initial_stock,
            'price': Decimal('100.00'),
            'vendor': vendor,
            'description': 'Test Desc',
            'pid': 'testpid'
        }
    )
    # Ensure fresh start
    product.stock_qty = initial_stock
    product.save()
    
    print(f"Initial Stock: {product.stock_qty}")

    # Create Order
    order, _ = CartOrder.objects.get_or_create(
        oid="TESTORDER001",
        defaults={
            'full_name': 'Test Buyer',
            'email': 'buyer@example.com',
            'buyer': user
        }
    )

    # TEST CASE 1: Qty = 1
    print("\n--- Test Case 1: Quantity = 1 ---")
    cart_item1, _ = CartOrderItem.objects.get_or_create(
        order=order,
        product=product,
        defaults={
            'qty': 1,
            'price': product.price,
            'total': product.price
        }
    )
    cart_item1.qty = 1
    cart_item1.save()
    
    view = MockView()
    
    # Simulate deduct_stock
    print("Just Checking Logic: Calling deduct_stock once...")
    view.deduct_stock([cart_item1])
    
    product.refresh_from_db()
    print(f"Stock after deduction: {product.stock_qty}")
    
    expected = initial_stock - 1
    if product.stock_qty == expected:
        print("✅ Correct deduction for Qty=1")
    else:
        print(f"❌ INCORRECT deduction for Qty=1. Expected {expected}, got {product.stock_qty}")

    # TEST CASE 2: Simulate duplicate call (Race Condition Hypothesis)
    print("\n--- Test Case 2: Simulate duplicate call (Race Condition) ---")
    product.stock_qty = initial_stock
    product.save()
    
    print("Calling deduct_stock TWICE...")
    view.deduct_stock([cart_item1])
    view.deduct_stock([cart_item1])
    
    product.refresh_from_db()
    print(f"Stock after double deduction: {product.stock_qty}")
    
    expected_double = initial_stock - 2
    print(f"Result: {product.stock_qty} (Initial - {initial_stock - product.stock_qty})")

    # TEST CASE 3: Qty = 2
    print("\n--- Test Case 3: Quantity = 2 ---")
    product.stock_qty = initial_stock
    product.save()
    
    cart_item2, _ = CartOrderItem.objects.get_or_create(
        order=order,
        product=product,
        defaults={
            'qty': 2,
            'price': product.price * 2,
            'total': product.price * 2
        }
    )
    cart_item2.qty = 2
    cart_item2.save()
    
    print("Calling deduct_stock once...")
    view.deduct_stock([cart_item2])
    
    product.refresh_from_db()
    print(f"Stock after deduction: {product.stock_qty}")
    
    expected_qty2 = initial_stock - 2
    if product.stock_qty == expected_qty2:
        print("✅ Correct deduction for Qty=2")
    else:
        print(f"❌ INCORRECT deduction for Qty=2. Expected {expected_qty2}, got {product.stock_qty}")

if __name__ == "__main__":
    reproduce()
