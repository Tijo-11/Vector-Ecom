from django.utils import timezone
from decimal import Decimal
from .models import ProductOffer, CategoryOffer
from django.db import models

def get_effective_discount(product):
    now = timezone.now()
    max_discount= Decimal('0.00')
    #Get active product offers
    product_offers = ProductOffer.objects.filter(
        products= product,
        is_active=True,
        start_date__lte= now,
    ).filter(models.Q(end_date__isnull=True) | models.Q(end_date__gte=now))
    if product_offers.exists():
        max_product_discount = max(offer.discount_percentage for offer in product_offers)
        max_discount = max(max_discount, max_product_discount)
        
    #Get category offers
    if product.category:
        category_offers = CategoryOffer.objects.filter(
            category=product.category,
            is_active=True,
            start_date__lte=now,
        ).filter(models.Q(end_date__isnull=True) | models.Q(end_date__gte=now))
        if category_offers.exists():
            max_category_discount = max(offer.discount_percentage for offer in category_offers)
            max_discount = max(max_discount, max_category_discount)

    return max_discount / Decimal('100')  # Return as decimal (e.g., 0.20)