# store/views/cart_views.py 
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from userauth.models import User
from store.models import Product, Cart
from store.serializers import CartSerializer
from addon.models import Tax
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q, Max
from django.utils import timezone
import logging
logger = logging.getLogger(__name__)

def get_active_user_cart(user):
    """Helper: Get user's active cart_id or None if none exists."""
    try:
        active_carts = Cart.objects.filter(user=user, is_active=True).order_by('-date')
        if active_carts.exists():
            return active_carts.first().cart_id
        return None
    except Exception as e:
        logger.error(f"Error in get_active_user_cart for user {user.id if user else 'None'}: {str(e)}")
        return None

class CartAPIView(generics.ListCreateAPIView):
    queryset = Cart.objects.filter(is_active=True)
    serializer_class = CartSerializer
    permission_classes = (AllowAny,)
   
    def create(self, request, *args, **kwargs):
        try:
            payload = request.data
            required = ['product', 'qty', 'price', 'shipping_amount', 'country', 'cart_id']
            if not all(k in payload for k in required):
                raise ValidationError("Missing required fields")
           
            product_id = int(payload['product'])
            qty = int(payload['qty'])
            
            # Fetch product first to get the correct price
            product = Product.objects.filter(status="published", id=product_id).first()
            if not product:
                return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

            # Use DB price instead of payload price to prevent client-side manipulation/double discounting
            price = product.price 
            
            shipping_amount = Decimal(payload['shipping_amount'])
            country = payload['country']
            size = payload.get('size', '')
            color = payload.get('color', '')
            cart_id = payload['cart_id']
           
            product = Product.objects.filter(status="published", id=product_id).first()
            if not product:
                return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
           
            user = None
            user_id = payload.get('user')
            if user_id:
                try:
                    user_id = int(user_id)
                    user = User.objects.get(id=user_id)
                except (ValueError, ObjectDoesNotExist):
                    return Response({"error": "Invalid user_id"}, status=status.HTTP_400_BAD_REQUEST)
           
            # Tax and service fee set to 0 for consistency
            tax_rate = Decimal('0.00')
            service_fee_percentage = Decimal('0.00')
           
            # Calculate offer discount
            now = timezone.now()
            product_discount = Decimal(0)
            category_discount = Decimal(0)
           
            if hasattr(product, 'product_offers'):
                product_offers = product.product_offers.filter(
                    start_date__lte=now
                ).filter(
                    Q(end_date__gte=now) | Q(end_date__isnull=True)
                )
                if product_offers.exists():
                    max_product_discount = product_offers.aggregate(
                        Max('discount_percentage')
                    )['discount_percentage__max'] or 0
                    product_discount = Decimal(max_product_discount)
           
            if product.category:
                category_offers = product.category.category_offers.filter(
                    start_date__lte=now
                ).filter(
                    Q(end_date__gte=now) | Q(end_date__isnull=True)
                )
                if category_offers.exists():
                    max_category_discount = category_offers.aggregate(
                        Max('discount_percentage')
                    )['discount_percentage__max'] or 0
                    category_discount = Decimal(max_category_discount)
           
            max_discount = max(product_discount, category_discount)
            discount_rate = max_discount / Decimal(100)
           
            # Pricing calculations (without tax and service fee)
            original_price = product.price
            original_sub_total = original_price * qty
            offer_saved = original_sub_total * discount_rate
            sub_total_after_offer = original_sub_total - offer_saved
            total_shipping = shipping_amount * qty
            service_fee = Decimal('0.00')
            tax_fee = Decimal('0.00')
            total = sub_total_after_offer + total_shipping
            initial_total = original_sub_total + total_shipping
           
            cart = Cart.objects.filter(cart_id=cart_id, product=product, is_active=True).first()
            if cart:
                cart.user = user
                cart.qty = qty
                cart.price = original_price
                cart.sub_total = sub_total_after_offer
                cart.shipping_amount = total_shipping
                cart.size = size
                cart.color = color
                cart.country = country
                cart.tax_fee = tax_fee
                cart.service_fee = service_fee
                cart.total = total
                cart.initial_total = initial_total
                cart.offer_saved = offer_saved
                cart.saved = offer_saved
                cart.save()
                msg = "Cart updated successfully"
            else:
                cart = Cart.objects.create(
                    product=product, user=user, qty=qty, price=original_price,
                    sub_total=sub_total_after_offer, shipping_amount=total_shipping,
                    size=size, color=color, country=country, cart_id=cart_id,
                    tax_fee=tax_fee, service_fee=service_fee, total=total,
                    initial_total=initial_total, offer_saved=offer_saved, saved=offer_saved
                )
                msg = "Cart created successfully"
           
            return Response(
                {"message": msg, "cart_id": cart.cart_id},
                status=status.HTTP_201_CREATED if 'created' in msg.lower() else status.HTTP_200_OK
            )
       
        except (ValueError, ValidationError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error in CartAPIView.create: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CartListView(generics.ListAPIView):
    serializer_class = CartSerializer
    permission_classes = (AllowAny,)
    queryset = Cart.objects.filter(is_active=True)
   
    def get_queryset(self):
        cart_id = self.kwargs['cart_id']
        user_id = self.kwargs.get('user_id')
       
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
                return Cart.objects.filter(user=user, cart_id=cart_id, is_active=True)
            except (ValueError, User.DoesNotExist):
                return Cart.objects.none()
        return Cart.objects.filter(cart_id=cart_id, is_active=True)
class CartDetailView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]
    lookup_field = 'cart_id'
    queryset = Cart.objects.filter(is_active=True)
    def get_queryset(self):
        cart_id = self.kwargs.get('cart_id')
        user_id = self.kwargs.get('user_id')
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
                return Cart.objects.filter(cart_id=cart_id, user=user, is_active=True)
            except (ValueError, User.DoesNotExist):
                return Cart.objects.none()
        return Cart.objects.filter(cart_id=cart_id, is_active=True)
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response({"error": "No active cart found"}, status=status.HTTP_404_NOT_FOUND)
       
        now = timezone.now()
        mrp_total = Decimal('0')
        offer_saved = Decimal('0')
        discounted_total = Decimal('0')
        shipping = Decimal('0')
        grand_total = Decimal('0')
        for item in queryset:
            product = item.product
            qty = item.qty
            base_price = product.price
            
            # calculate discount
            product_discount = Decimal(0)
            if hasattr(product, 'product_offers'):
                product_offers = product.product_offers.filter(
                    start_date__lte=now
                ).filter(
                    Q(end_date__gte=now) | Q(end_date__isnull=True)
                )
                if product_offers.exists():
                    max_product_discount = product_offers.aggregate(
                        Max('discount_percentage')
                    )['discount_percentage__max'] or 0
                    product_discount = Decimal(max_product_discount)
            category_discount = Decimal(0)
            if product.category:
                category_offers = product.category.category_offers.filter(
                    start_date__lte=now
                ).filter(
                    Q(end_date__gte=now) | Q(end_date__isnull=True)
                )
                if category_offers.exists():
                    max_category_discount = category_offers.aggregate(
                        Max('discount_percentage')
                    )['discount_percentage__max'] or 0
                    category_discount = Decimal(max_category_discount)
            max_discount = max(product_discount, category_discount)
            discount_rate = max_discount / Decimal(100)
            original_sub_total = base_price * qty
            item_offer_saved = original_sub_total * discount_rate
            item_discounted = original_sub_total - item_offer_saved
            item_shipping = item.shipping_amount
            item_total = item_discounted + item_shipping
            mrp_total += original_sub_total
            offer_saved += item_offer_saved
            discounted_total += item_discounted
            shipping += item_shipping
            grand_total += item_total
        totals = {
            'mrp_total': mrp_total,
            'offer_saved': offer_saved,
            'discounted_total': discounted_total,
            'shipping': shipping,
            'grand_total': grand_total,
        }
        return Response(totals)

class CartItemDeleteAPIView(generics.DestroyAPIView):
    serializer_class = CartSerializer
    lookup_field = "cart_id"
   
    def get_object(self):
        cart_id = self.kwargs["cart_id"]
        item_id = self.kwargs["item_id"]
        user_id = self.kwargs.get("user_id")
       
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
                return Cart.objects.get(id=item_id, cart_id=cart_id, user=user, is_active=True)
            except (ValueError, Cart.DoesNotExist):
                raise Cart.DoesNotExist
        try:
            return Cart.objects.get(id=item_id, cart_id=cart_id, is_active=True)
        except Cart.DoesNotExist:
            raise Cart.DoesNotExist
   
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

class CartMergeAPIView(APIView):
    permission_classes = (AllowAny,)
   
    def post(self, request):
        try:
            user_id = request.data.get('user_id')
           
            if not user_id:
                return Response({"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)
           
            try:
                user_id = int(user_id)
                user = User.objects.get(id=user_id)
            except (ValueError, User.DoesNotExist):
                return Response({"error": "Invalid or not found user"}, status=status.HTTP_404_NOT_FOUND)
           
            user_cart_id = get_active_user_cart(user)
           
            if user_cart_id:
                count = Cart.objects.filter(cart_id=user_cart_id, user=user, is_active=True).count()
                return Response({
                    "cart_id": user_cart_id,
                    "message": "User cart loaded",
                    "start_new": False,
                    "cart_count": count
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "cart_id": None,
                    "message": "No active cart; start new",
                    "start_new": True,
                    "cart_count": 0
                }, status=status.HTTP_200_OK)
       
        except Exception as e:
            logger.error(f"Error in CartMergeAPIView: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)