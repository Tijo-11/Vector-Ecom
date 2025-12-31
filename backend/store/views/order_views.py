# store/views/order_views.py (Fixed)

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

        # Handle user (optional)
        user = None
        if user_id and user_id != "0":
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response(
                    {"error": "User with provided ID does not exist"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Get active cart items
        cart_items = Cart.objects.filter(cart_id=cart_id, is_active=True)
        if user:
            cart_items = cart_items.filter(user=user)

        if not cart_items.exists():
            return Response(
                {"error": "No active cart items found for the provided cart_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()

        with transaction.atomic():
            total_shipping = Decimal(0)
            total_tax = Decimal(0)
            total_service_fee = Decimal(0)
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
                # === Calculate max discount from Product & Category Offers ===
                product_discount = Decimal(0)
                if hasattr(c.product, 'product_offers'):
                    product_offers = c.product.product_offers.filter(
                        start_date__lte=now
                    ).filter(
                        Q(end_date__gte=now) | Q(end_date__isnull=True)
                    )
                    if product_offers.exists():
                        product_discount = product_offers.aggregate(
                            Max('discount_percentage')
                        )['discount_percentage__max'] or Decimal(0)

                category_discount = Decimal(0)
                if c.product.category:
                    category_offers = c.product.category.category_offers.filter(
                        start_date__lte=now
                    ).filter(
                        Q(end_date__gte=now) | Q(end_date__isnull=True)
                    )
                    if category_offers.exists():
                        category_discount = category_offers.aggregate(
                            Max('discount_percentage')
                        )['discount_percentage__max'] or Decimal(0)

                max_discount = max(product_discount, category_discount)
                discount_rate = max_discount / Decimal(100)

                # === Pricing Calculations ===
                original_sub_total = c.sub_total
                discounted_sub_total = original_sub_total * (Decimal(1) - discount_rate)

                shipping = c.shipping_amount
                total_shipping += shipping

                # Service fee (2%)
                service_fee = discounted_sub_total * Decimal('0.02')
                total_service_fee += service_fee

                # Tax (based on original ratio)
                tax_rate = c.tax_fee / original_sub_total if original_sub_total > 0 else Decimal(0)
                tax_fee = discounted_sub_total * tax_rate
                total_tax += tax_fee

                # Totals
                total = discounted_sub_total + shipping + service_fee + tax_fee
                initial_total = original_sub_total + shipping + (original_sub_total * Decimal('0.02')) + (original_sub_total * tax_rate)
                saved = initial_total - total

                total_subtotal += discounted_sub_total
                total_initial_total += initial_total
                total_total += total

                # Create order item
                CartOrderItem.objects.create(
                    order=order,
                    product=c.product,
                    vendor=c.product.vendor,
                    qty=c.qty,
                    color=c.color,
                    size=c.size,
                    price=c.price,
                    sub_total=discounted_sub_total,
                    shipping_amount=shipping,
                    service_fee=service_fee,
                    tax_fee=tax_fee,
                    total=total,
                    initial_total=initial_total,
                    saved=saved
                )
                order.vendor.add(c.product.vendor)

            # Update order totals
            order.sub_total = total_subtotal
            order.shipping_amount = total_shipping
            order.tax_fee = total_tax
            order.service_fee = total_service_fee
            order.initial_total = total_initial_total
            order.total = total_total
            order.saved = total_initial_total - total_total  # Total saved
            order.save()

        return Response(
            {"message": "Order Created Successfully", "order_oid": order.oid},
            status=status.HTTP_201_CREATED
        )


class CheckoutView(generics.RetrieveAPIView):
    serializer_class = CartOrderSerializer
    lookup_field = 'order_oid'

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

        # Prevent multiple coupons
        if CartOrderItem.objects.filter(order=order, coupon__isnull=False).exists():
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
                discount = item.total * (coupon.discount / 100)
                item.total -= discount
                item.sub_total -= discount
                item.saved += discount
                item.coupon.add(coupon)
                item.save()

                order.total -= discount
                order.sub_total -= discount
                order.saved += discount

        order.save()

        return Response(
            {"message": "Coupon Applied Successfully", "icon": "success"},
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