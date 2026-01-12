from store.models import Product, ProductOffer
from decimal import Decimal

products = Product.objects.filter(status="published")[:5]
for p in products:
    print(f"ID: {p.id} | Title: {p.title}")
    print(f"  Price: {p.price} (Base Price)")
    print(f"  Old Price: {p.old_price}")
    
    offers = ProductOffer.objects.filter(products=p)
    if offers.exists():
        for o in offers:
            print(f"  Active Offer: {o.discount_percentage}%")
            discount_rate = o.discount_percentage / Decimal(100)
            calc_discount = p.price * discount_rate
            final = p.price - calc_discount
            print(f"  Calculated Discounted Price: {final}")
