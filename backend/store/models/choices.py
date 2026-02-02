# choices.py

DISCOUNT_TYPE = (
    ("Percentage", "Percentage"),
    ("Flat Rate", "Flat Rate"),
)

STATUS_CHOICE = (
    ("processing", "Processing"),
    ("shipped", "Shipped"),
    ("delivered", "Delivered"),
)

STATUS = (
    ("draft", "Draft"),
    ("disabled", "Disabled"),
    ("rejected", "Rejected"),
    ("in_review", "In Review"),
    ("published", "Published"),
)

PAYMENT_STATUS = (
    ("paid", "Paid"),
    ("pending", "Pending"),
    ("processing", "Processing"),
    ("cancelled", "Cancelled"),
    ("initiated", "Initiated"),
    ("failed", "Failed"),
    ("refunding", "Refunding"),
    ("refunded", "Refunded"),
    ("unpaid", "Unpaid"),
    ("expired", "Expired"),
)

ORDER_STATUS = (
    ("Pending", "Pending"),
    ("Fulfilled", "Fulfilled"),
    ("Partially Fulfilled", "Partially Fulfilled"),
    ("Cancelled", "Cancelled"),
)

AUCTION_STATUS = (
    ("on_going", "On Going"),
    ("finished", "Finished"),
    ("cancelled", "Cancelled"),
)

WIN_STATUS = (
    ("won", "Won"),
    ("lost", "Lost"),
    ("pending", "Pending"),
)

PRODUCT_TYPE = (
    ("regular", "Regular"),
    ("auction", "Auction"),
    ("offer", "Offer"),
)

OFFER_STATUS = (
    ("accepted", "Accepted"),
    ("rejected", "Rejected"),
    ("pending", "Pending"),
)

PRODUCT_CONDITION = (
    ("new", "New"),
    ("old_2nd_hand", "Used or 2nd Hand"),
    ("custom", "Custom"),
)

PRODUCT_CONDITION_RATING = tuple((i, f"{i}/10") for i in range(1, 11))

DELIVERY_STATUS = (
    ("On Hold", "On Hold"),
    ("Shipping Processing", "Shipping Processing"),
    ("Shipped", "Shipped"),
    ("Out for Delivery", "Out for Delivery"),
    ("Arrived", "Arrived"),
    ("Delivered", "Delivered"),
    ("Return Requested", "Return Requested"),
    ("Returning", "Returning"),
    ("Returned", "Returned"),
    ("Cancelled", "Cancelled"),
)

PAYMENT_METHOD = (
    ("Paypal", "Paypal"),
    ("Credit/Debit Card", "Credit/Debit Card"),
    ("Wallet Points", "Wallet Points"),
)

RATING = (
    (1, "★☆☆☆☆"),
    (2, "★★☆☆☆"),
    (3, "★★★☆☆"),
    (4, "★★★★☆"),
    (5, "★★★★★"),
)

CANCELLATION_REASON_CHOICES = (
    ("changed_mind", "Changed my mind"),
    ("better_price", "Found better price elsewhere"),
    ("ordered_mistake", "Ordered by mistake"),
    ("delivery_time", "Delivery time too long"),
    ("other", "Other"),
)

RETURN_REASON_CHOICES = (
    ("defective", "Defective or damaged product"),
    ("wrong_item", "Wrong item received"),
    ("not_described", "Not as described"),
    ("poor_quality", "Poor quality"),
    ("changed_mind", "Changed my mind"),
    ("other", "Other"),
)
