from .common import *

class CreateOrderView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    queryset = CartOrder.objects.all()
    permission_classes = (AllowAny,)
    
    def create(self, request, *args, **kwargs):  # Override default create method
        payload = request.data
        full_name = payload['full_name']
        email = payload['email']
        city = payload['city']
        address = payload['address']
        country = payload['country']
        mobile = payload['mobile']
        state = payload['state']
        cart_id = payload['cart_id']
        user_id = payload.get('user_id')  # Use .get() to avoid KeyError
        
        # Handle user_id
        user = None
        if user_id and user_id != "0":  # Treat user_id as string
            user = User.objects.filter(id=user_id).first()  # Use .first() to avoid DoesNotExist
            if not user:
                return Response(
                    {"error": "User with provided ID does not exist"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        cart_items = Cart.objects.filter(cart_id=cart_id)
        if not cart_items.exists():
            return Response(
                {"error": "No cart items found for the provided cart_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_shipping = Decimal(0.00)
        total_tax = Decimal(0.00)
        total_service_fee = Decimal(0.00)
        total_subtotal = Decimal(0.00)
        total_initial_total = Decimal(0.00)
        total_total = Decimal(0.00)  # After applying coupon
        
        order = CartOrder.objects.create(
            full_name=full_name,
            email=email,
            city=city,
            address=address,
            country=country,
            mobile=mobile,
            state=state,
            buyer=user  # Assign user (None if no valid user)
        )
        
        for c in cart_items:
            CartOrderItem.objects.create(  # Fixed typo: 'object' to 'objects'
                order=order,
                product=c.product,
                vendor=c.product.vendor,
                qty=c.qty,
                color=c.color,
                size=c.size,
                price=c.price,
                sub_total=c.sub_total,
                shipping_amount=c.shipping_amount,
                service_fee=c.service_fee,
                total=c.total,
                tax_fee=c.tax_fee,
                initial_total=c.total
            )
            
            total_shipping += Decimal(c.shipping_amount)
            total_tax += Decimal(c.tax_fee)
            total_service_fee += Decimal(c.service_fee)
            total_subtotal += Decimal(c.sub_total)
            total_initial_total += Decimal(c.total)
            total_total += Decimal(c.total)  # After applying coupon
            
            order.vendor.add(c.product.vendor)
        
        order.sub_total = total_subtotal
        order.shipping_amount = total_shipping
        order.tax_fee = total_tax
        order.service_fee = total_service_fee
        order.initial_total = total_initial_total
        order.total = total_total
        
        order.save()
        return Response(
            {"message": "Order Created Successfully", "order_oid": order.oid},
            status=status.HTTP_201_CREATED
        )
        
        
# Redundancy and Future-Proofing:

# The use of both total_initial_total and total_total (both set to c.total) seems redundant in this view because 
# no discounts are applied. However, the structure is designed to accommodate future coupon/discount logic,
# where total_total could be reduced (e.g., total_total -= discount), while total_initial_total retains the sum
# of c.total for comparison.
# For example, if a coupon reduces the order total by ₹500, order.total would reflect total_total - 500, while 
# order.initial_total would still equal total_initial_total, allowing the system to display savings (e.g., 
# "You saved ₹500").
#c.total refers to the total cost of an individual cart item (Cart model instance), which typically includes 
# the item’s subtotal, shipping amount, tax fee, and service fee for that specific item. It represents the final 
# cost for that cart item, accounting for all associated charges.
#total_initial_total is used to accumulate the sum of c.total for all cart items, representing the original total
# cost of the order before any discounts or coupons are applied. The transcript emphasizes that initial_total
# in the CartOrderItems model (and thus total_initial_total in the view) captures the "original total" for each
# item, which is stored to track the pre-discount cost.
#total_total also accumulates c.total for all cart items, representing the current total cost of the order. 
# In this implementation, since no discounts or coupons are applied within the view, total_total is effectively
# the same as total_initial_total. Both are sums of c.total across all cart items.
        
        
        
        
    
        
        
        