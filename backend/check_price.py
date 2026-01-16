import os
import django
import sys
from decimal import Decimal

# Set up Django environment
sys.path.append(r'e:\Coding and Other Learning\Brototype\Tasks\Max-Limit QA\MultiVendorE-com\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from store.models import Product, ProductOffer

def check_prices():
    products = Product.objects.filter(status="published")[:5]
    for p in products:
        print(f"ID: {p.id} | Title: {p.title}")
        print(f"  Price: {p.price} (Base Price)")
        
        # Check offers
        offers = ProductOffer.objects.filter(products=p)
        if offers.exists():
            for o in offers:
                print(f"  Active Offer: {o.discount_percentage}%")
                
                # Calculate what backend would do
                discount_rate = o.discount_percentage / Decimal(100)
                calc_discount = p.price * discount_rate
                final = p.price - calc_discount
                print(f"  Calculated Discounted Price: {final}")

if __name__ == "__main__":
    check_prices()
