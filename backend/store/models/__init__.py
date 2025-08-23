from .product import Product
from .category import  Brand, Tag, Category
from .order import Cart, CartOrder, CartOrderItem, CancelledOrder, Coupon, CouponUsers, DeliveryCouriers
from .user import Wishlist, Address, Notification
from .review import Review, ProductFaq
from .item import Gallery, Specification, Color, Size
# from .choices import (
#     STATUS, RATING, PRODUCT_TYPE, PAYMENT_STATUS, ORDER_STATUS,
#     DISCOUNT_TYPE, DELIVERY_STATUS, OFFER_STATUS, WIN_STATUS,
#     PRODUCT_CONDITION, PRODUCT_CONDITION_RATING, PAYMENT_METHOD
# ) It doesn't need here
__all__ = [
    "Product", "Category", "Brand", "Tag", "Specification", "Size", "Color", "Gallery", "ProductFaq",
    "Cart", "CartOrder", "CartOrderItem", "CancelledOrder", "Coupon", "CouponUsers", "DeliveryCouriers",
    "Wishlist", "Address", "Notification", "Review",
    #choices
    # "DISCOUNT_TYPE", "STATUS_CHOICE", "STATUS", "PAYMENT_STATUS", "ORDER_STATUS",
    # "AUCTION_STATUS", "WIN_STATUS", "PRODUCT_TYPE", "OFFER_STATUS",
    # "PRODUCT_CONDITION", "PRODUCT_CONDITION_RATING", "DELIVERY_STATUS",
    # "PAYMENT_METHOD", "RATING", #Redundant
]

#__all__ is a declaration of what should be exported when someone does from models import *,
# but it doesn't import anything by itself.
#Without the actual imports, Python won’t know what Product or Review even are.












'''
he __init__.py file in your models/ directory can be a powerful tool to streamline your imports and make
your codebase cleaner and more DRY.

Here’s how you can use it effectively:

🧩 Purpose of __init__.py in a models/ Directory
When you split your models across multiple files (like product.py, order.py, etc.), Django won’t 
automatically know where to find them unless you import them somewhere. That’s where __init__.py comes in.

✅ What You Can Do in __init__.py
1. Centralize Model Imports
Instead of importing models from individual files throughout your project, you can expose them all
from __init__.py:

python
# models/__init__.py

from .product import Product, Category, Brand, Tag, Specification, Size, Color, Gallery, ProductFaq
from .order import Cart, CartOrder, CartOrderItem, CancelOrder, Coupon, CouponUsers, DeliveryCountries
from .user import Wishlist, Address, Notifications
from .review import Review
Now you can simply do:

python
from your_app.models import Product, CartOrder
instead of:

python
from your_app.models.product import Product
from your_app.models.order import CartOrder
2. Expose Shared Constants
If you also move your choice tuples to a choices.py file, you can import them here too:

python
from ..choices import (
    DISCOUNT_TYPE, STATUS_CHOICE, STATUS, PAYMENT_STATUS, ORDER_STATUS,
    AUCTION_STATUS, WIN_STATUS, PRODUCT_TYPE, OFFER_STATUS,
    PRODUCT_CONDITION, PRODUCT_CONDITION_RATING, DELIVERY_STATUS,
    PAYMENT_METHOD, RATING
)
This makes them available wherever you import from models.

3. Avoid Circular Imports
By centralizing imports in __init__.py, you reduce the risk of circular dependencies between model files 
— especially helpful when models reference each other via ForeignKey or ManyToMany relationships.

🧠 Bonus Tip: Use __all__ for Clarity
You can define __all__ to explicitly declare what’s exported:

python
__all__ = [
    "Product", "Category", "Brand", "Tag", "Specification", "Size", "Color", "Gallery", "ProductFaq",
    "Cart", "CartOrder", "CartOrderItem", "CancelOrder", "Coupon", "CouponUsers", "DeliveryCountries",
    "Wishlist", "Address", "Notifications", "Review"
'''