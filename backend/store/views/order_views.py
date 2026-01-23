# store/views/order_views.py - FIXED VERSION (Removed tax_fee and service_fee from calculations)
from django.db.models import Q
from django.db import transaction
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from store.serializers import CartOrderSerializer, CouponSerializer
from userauth.models import User
from store.models import CartOrderItem, Cart, CartOrder, Coupon
from decimal import Decimal
from django.utils import timezone
from django.db.models import Max

class CreateOrderView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer
    queryset = CartOrder.objects.all()
    permission_classes = (AllowAny,)
    
    def create(self, request, *args, **kwargs):
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
        user_id = payload.get('user_id')
        
        user = None
        if user_id and user_id != "0":
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response(
                    {"error": "User with provided ID does not exist"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        cart_items = Cart.objects.filter(cart_id=cart_id, is_active=True)
        if user:
            cart_items = cart_items.filter(user=user)
        if not cart_items.exists():
            return Response(
                {"error": "No active cart items found for the provided cart_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        now = timezone.now()
        adjusted = False
        items_created = False
        
        with transaction.atomic():
            total_shipping = Decimal(0)
            total_subtotal = Decimal(0)
            total_initial_total = Decimal(0)
            total_total = Decimal(0)
            
            order = CartOrder.objects.create(
                full_name=full_name,
                email=email,
                city=city,
                address=address,
                country=country,
                mobile=mobile,
                state=state,
                postal_code=postal_code,
                buyer=user
            )
            
            for c in cart_items:
                product = c.product
                available_stock = product.stock_qty or 0
                
                qty = c.qty
                if qty > available_stock:
                    adjusted = True
                    if available_stock <= 0:
                        c.is_active = False
                        c.save()
                        continue
                    else:
                        # Adjust qty and scale all monetary fields proportionally
                        ratio = Decimal(available_stock) / Decimal(c.qty)
                        qty = available_stock
                        c.qty = qty
                        c.sub_total *= ratio
                        c.initial_total *= ratio
                        c.offer_saved *= ratio
                        c.shipping_amount *= ratio
                        c.total = c.sub_total + c.shipping_amount
                        c.saved *= ratio
                        c.save()
                
                # Recalculate discounts fresh (in case offers changed)
                product_discount = Decimal(0)
                if hasattr(product, 'product_offers'):
                    product_offers = product.product_offers.filter(start_date__lte=now).filter(
                        Q(end_date__gte=now) | Q(end_date__isnull=True)
                    )
                    if product_offers.exists():
                        product_discount = Decimal(product_offers.aggregate(Max('discount_percentage'))['discount_percentage__max'] or 0)
                
                category_discount = Decimal(0)
                if product.category:
                    category_offers = product.category.category_offers.filter(start_date__lte=now).filter(
                        Q(end_date__gte=now) | Q(end_date__isnull=True)
                    )
                    if category_offers.exists():
                        category_discount = Decimal(category_offers.aggregate(Max('discount_percentage'))['discount_percentage__max'] or 0)
                
                max_discount = max(product_discount, category_discount)
                discount_rate = max_discount / Decimal(100)
                
                base_price = product.price
                original_sub_total = base_price * qty
                offer_saved = original_sub_total * discount_rate
                discounted_sub_total = original_sub_total - offer_saved
                shipping = c.shipping_amount  # already scaled above if adjusted
                
                total_shipping += shipping
                total_subtotal += discounted_sub_total
                total_initial_total += original_sub_total + shipping
                total_total += discounted_sub_total + shipping
                
                if qty > 0:
                    CartOrderItem.objects.create(
                        order=order,
                        product=product,
                        vendor=product.vendor,
                        qty=qty,
                        color=c.color,
                        size=c.size,
                        price=base_price,
                        sub_total=discounted_sub_total,
                        shipping_amount=shipping,
                        service_fee=Decimal('0.00'),
                        tax_fee=Decimal('0.00'),
                        total=discounted_sub_total + shipping,
                        initial_total=original_sub_total + shipping,
                        offer_saved=offer_saved,
                        coupon_saved=Decimal(0.00),
                        saved=(original_sub_total + shipping) - (discounted_sub_total + shipping)
                    )
                    order.vendor.add(product.vendor)
                    items_created = True
            
            if not items_created:
                order.delete()
                return Response(
                    {"error": "All items are currently out of stock or unavailable. Please review your cart."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order.sub_total = total_subtotal
            order.shipping_amount = total_shipping
            order.tax_fee = Decimal('0.00')
            order.service_fee = Decimal('0.00')
            order.initial_total = total_initial_total
            order.total = total_total
            order.offer_saved = total_initial_total - total_total
            order.coupon_saved = Decimal(0.00)
            order.saved = order.offer_saved
            order.save()
        
        message = "Order Created Successfully"
        if adjusted:
            message += " (some quantities were adjusted to current available stock)"
        
        return Response(
            {"message": message, "order_oid": order.oid},
            status=status.HTTP_201_CREATED
        )


class CheckoutView(generics.RetrieveAPIView):
    serializer_class = CartOrderSerializer
    lookup_field = 'oid'
    def get_object(self):
        order_oid = self.kwargs['order_oid']
        order = CartOrder.objects.get(oid=order_oid)
        return order

class CouponAPIView(generics.CreateAPIView):
    serializer_class = CouponSerializer
    queryset = Coupon.objects.all()
    permission_classes = (AllowAny,)
    def create(self, request):
        payload = request.data
        order_oid = payload['order_oid']
        coupon_code = payload['coupon_code'].upper().strip()
        try:
            order = CartOrder.objects.get(oid=order_oid)
        except CartOrder.DoesNotExist:
            return Response(
                {"message": "Order not found", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            coupon = Coupon.objects.get(code__iexact=coupon_code)
            if not coupon.active:
                return Response(
                    {"message": "This coupon is not active", "icon": "warning"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Coupon.DoesNotExist:
            return Response(
                {"message": "Invalid Coupon Code", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if order.buyer:
            if coupon.used_by.filter(id=order.buyer.id).exists():
                return Response(
                    {"message": "You have already used this coupon", "icon": "warning"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        if coupon.vendor is None:
            order_items = CartOrderItem.objects.filter(order=order)
        else:
            order_items = CartOrderItem.objects.filter(order=order, vendor=coupon.vendor)
       
        if not order_items.exists():
            return Response(
                {"message": "No items from this coupon's vendor in the order", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            # Step 1: Reverse any existing coupon discount on these items
            for item in order_items:
                old_discount = item.coupon_saved
                if old_discount > 0:
                    old_sub_total = item.sub_total
                    item.sub_total += old_discount
                    item.saved -= old_discount
                    item.coupon_saved = Decimal('0.00')
                    # No fees to recalculate since set to 0
                    new_sub_total = item.sub_total
                    new_total = new_sub_total + item.shipping_amount
                    item.total = new_total
                item.coupon.clear()
                item.save()
            # Update order after reversal
            order.sub_total = sum(i.sub_total for i in order_items)
            order.tax_fee = Decimal('0.00')
            order.service_fee = Decimal('0.00')
            order.total = sum(i.total for i in order_items)
            order.saved = sum(i.saved for i in order_items)
            order.coupon_saved = sum(i.coupon_saved for i in order_items)
            order.save()
            # Step 2: Apply the new coupon
            rate = Decimal(coupon.discount) / Decimal(100)
            for item in order_items:
                original_sub_total = item.price * item.qty
                offer_saved = item.offer_saved
                discount = item.sub_total * rate
                old_sub_total = item.sub_total
                item.coupon_saved = discount
                item.saved += discount
                item.sub_total -= discount
                final_sub_total = item.sub_total
                new_total = final_sub_total + item.shipping_amount
                item.total = new_total
                item.coupon.add(coupon)
                item.save()
            # Update order after application
            order.sub_total = sum(i.sub_total for i in order_items)
            order.tax_fee = Decimal('0.00')
            order.service_fee = Decimal('0.00')
            order.total = sum(i.total for i in order_items)
            order.saved = sum(i.saved for i in order_items)
            order.coupon_saved = sum(i.coupon_saved for i in order_items)
            order.coupons.add(coupon)
            order.save()
        return Response(
            {"message": "Coupon Applied Successfully", "icon": "success"},
            status=status.HTTP_200_OK
        )

class RemoveCouponAPIView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    def create(self, request):
        payload = request.data
        order_oid = payload.get('order_oid')
        if not order_oid:
            return Response(
                {"message": "order_oid is required", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            order = CartOrder.objects.get(oid=order_oid)
        except CartOrder.DoesNotExist:
            return Response(
                {"message": "Order not found", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )
        order_items = CartOrderItem.objects.filter(order=order, coupon__isnull=False)
        if not order_items.exists():
            return Response(
                {"message": "No coupon applied to this order", "icon": "warning"},
                status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            for item in order_items:
                discount = item.coupon_saved
                old_sub_total = item.sub_total
                if discount > 0:
                    item.sub_total += discount
                    item.saved -= discount
                    item.coupon_saved = Decimal('0.00')
                    # No fees to recalculate
                    new_sub_total = item.sub_total
                    new_total = new_sub_total + item.shipping_amount
                    item.total = new_total
                item.coupon.clear()
                item.save()
            order.sub_total = sum(i.sub_total for i in order_items)
            order.tax_fee = Decimal('0.00')
            order.service_fee = Decimal('0.00')
            order.total = sum(i.total for i in order_items)
            order.saved = sum(i.saved for i in order_items)
            order.coupon_saved = Decimal('0.00')
            order.save()
        return Response(
            {"message": "Coupon Removed Successfully", "icon": "success"},
            status=status.HTTP_200_OK
        )

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