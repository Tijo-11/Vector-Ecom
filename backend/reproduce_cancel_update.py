import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from vendor.views.order_status_views import UpdateOrderStatusView
from store.models import CartOrder, CartOrderItem, Product, Category
from userauth.models import User
from vendor.models import Vendor

def reproduce():
    # Setup data
    user = User.objects.create(username='testuser', email='test@example.com')
    vendor_user = User.objects.create(username='vendor', email='vendor@example.com')
    vendor = Vendor.objects.create(user=vendor_user, name='Test Vendor')
    
    category = Category.objects.create(title="Test Category")
    product = Product.objects.create(
        title="Test Product", 
        price=Decimal("100.00"), 
        vendor=vendor,
        category=category
    )
    
    order = CartOrder.objects.create(
        buyer=user,
        total=Decimal("100.00"),
        payment_status="paid"
    )
    
    # Create an order item with 'Cancelled' status
    order_item = CartOrderItem.objects.create(
        order=order,
        product=product,
        vendor=vendor,
        qty=1,
        price=Decimal("100.00"),
        total=Decimal("100.00"),
        delivery_status="Cancelled"  # ALREADY CANCELLED
    )
    
    print(f"Created order item with status: {order_item.delivery_status}")

    # Prepare Request
    factory = APIRequestFactory()
    view = UpdateOrderStatusView.as_view()
    
    # Attempt to update status to "Delivered"
    payload = {'delivery_status': 'Delivered'}
    request = factory.put(f'/vendor/order-item-status/{order_item.id}/', payload, format='json')
    force_authenticate(request, user=vendor_user)
    
    print("Attempting to update status to 'Delivered'...")
    response = view(request, pk=order_item.id)
    
    print(f"Response Status Code: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    # Verify result
    order_item.refresh_from_db()
    print(f"Order item status after request: {order_item.delivery_status}")

    if response.status_code == 200 and order_item.delivery_status == "Delivered":
        print("FAIL: Successfully changed status of a Cancelled order.")
    elif response.status_code == 400 and order_item.delivery_status == "Cancelled":
        print("SUCCESS: Prevented changing status of a Cancelled order.")
    else:
        print("UNKNOWN RESULT.")

    # Cleanup
    order_item.delete()
    order.delete()
    product.delete()
    category.delete()
    vendor.delete()
    user.delete()
    vendor_user.delete()

if __name__ == '__main__':
    try:
        reproduce()
    except Exception as e:
        print(f"An error occurred: {e}")
