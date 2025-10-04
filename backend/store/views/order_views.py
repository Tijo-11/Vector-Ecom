from .common import *
from django.db import transaction  # Add this import for atomic transaction
from decimal import Decimal

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
        postal_code = payload['pincode']
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
        
        # Use a database transaction to ensure stock updates are atomic with order creation
        with transaction.atomic():
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
                postal_code=postal_code,
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
                
                # Update product stock after creating the order item
                # This ensures stock is decreased only on successful order placement
                product = c.product
                if product.stock_qty >= c.qty:
                    product.stock_qty -= c.qty
                    product.save()  # This will also update in_stock via the model's save method
                else:
                    # If stock is insufficient, you might want to handle this (e.g., rollback or error)
                    # For now, we'll assume validation happened earlier; adjust as needed
                    raise ValueError(f"Insufficient stock for product {product.title}: {c.qty} requested, {product.stock_qty} available")
            
            order.sub_total = total_subtotal
            order.shipping_amount = total_shipping
            order.tax_fee = total_tax
            order.service_fee = total_service_fee
            order.initial_total = total_initial_total
            order.total = total_total
            
            order.save()
        
        # Transaction commits here on success; rolls back on any exception (e.g., stock issues)
        return Response(
            {"message": "Order Created Successfully", "order_oid": order.oid},
            status=status.HTTP_201_CREATED
        )
        
#----------------------------------------------------------
class CheckoutView(generics.RetrieveAPIView):
    serializer_class = CartOrderSerializer
    lookup_field = 'order_oid'
    
    def get_object(self): #override
        order_oid = self.kwargs['order_oid']
        order = CartOrder.objects.get(oid= order_oid)
        return order
#----------------CouponOrder
class CouponAPIView(generics.CreateAPIView):
    serializer_class = CouponSerializer
    queryset = Coupon.objects.all()
    permission_classes = (AllowAny,)

    def create(self, request):
        payload = request.data
        order_oid = payload['order_oid']
        coupon_code = payload['coupon_code']

        try:
            order = CartOrder.objects.get(oid=order_oid)
        except CartOrder.DoesNotExist:
            return Response(
                {"message": "Order not found", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            coupon = Coupon.objects.get(code=coupon_code)
        except Coupon.DoesNotExist:
            return Response(
                {"message": "Invalid Coupon", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if order already has any coupon applied
        already_applied = CartOrderItem.objects.filter(order=order, coupon__isnull=False).exists()
        if already_applied:
            return Response(
                {"message": "A coupon is already applied to this order", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order_items = CartOrderItem.objects.filter(order=order, vendor=coupon.vendor)
        if not order_items.exists():
            return Response(
                {"message": "No items from this vendor in the order", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )

        for item in order_items:
            if not item.coupon.filter(id=coupon.id).exists():
                discount = item.total * coupon.discount / 100
                item.total -= discount
                item.sub_total -= discount
                item.coupon.add(coupon)
                item.saved += discount
                item.save()

                order.total -= discount
                order.sub_total -= discount
                order.saved += discount

        order.save()
        return Response(
            {"message": "Coupon Applied Successfully", "icon": "success"},
            status=status.HTTP_200_OK
        )
        
#------------
class OrdersDetailAPIView(generics.RetrieveAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = (AllowAny,)

    def get_object(self):
        order_id = self.kwargs['order_id']
        order = CartOrder.objects.get(
    Q(payment_status="paid") | Q(payment_status="processing"),
    oid=order_id
)
        return order