# store/views/cart_views.py

# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

# Models
from userauth.models import User
from store.models import Product, Cart
from store.serializers import CartSerializer
from addon.models import Tax

# Others Packages
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist
import logging

logger = logging.getLogger(__name__)

def get_active_user_cart(user):
    """Helper: Get user's active cart_id or None if none exists."""
    try:
        # FIXED: Use 'date' instead of non-existent 'created_at'
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
                raise ValidationError("Missing required fields: product, qty, price, shipping_amount, country, cart_id")
            
            product_id = int(payload['product'])
            qty = int(payload['qty'])
            price = Decimal(payload['price'])
            shipping_amount = Decimal(payload['shipping_amount'])
            country = payload['country']
            size = payload.get('size', '')
            color = payload.get('color', '')
            cart_id = payload['cart_id']
            
            product = Product.objects.filter(status="published", id=product_id).first()
            if not product:
                return Response({"error": "Product not found or not published"}, status=status.HTTP_404_NOT_FOUND)
            
            user = None
            user_id = payload.get('user')
            if user_id:
                try:
                    user_id = int(user_id)
                    user = User.objects.get(id=user_id)
                except (ValueError, ObjectDoesNotExist):
                    return Response({"error": "Invalid user_id"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Tax calc
            tax_obj = Tax.objects.filter(country=country).first()
            tax_rate = (tax_obj.rate / 100) if tax_obj else Decimal('0.05')
            
            # Service fee
            service_fee_percentage = Decimal('0.02')
            
            cart = Cart.objects.filter(cart_id=cart_id, product=product, is_active=True).first()
            if cart:
                # Update existing
                cart.user = user
                cart.qty = qty
                cart.price = price
                cart.sub_total = price * qty
                cart.shipping_amount = shipping_amount * qty
                cart.size = size
                cart.color = color
                cart.country = country
                cart.tax_fee = (price * qty) * tax_rate
                cart.service_fee = cart.sub_total * service_fee_percentage
                cart.total = (cart.sub_total + cart.shipping_amount + cart.service_fee + cart.tax_fee)
                cart.save()
                msg = "Cart updated successfully"
            else:
                # Create new
                cart = Cart.objects.create(
                    product=product, user=user, qty=qty, price=price,
                    sub_total=price * qty, shipping_amount=shipping_amount * qty,
                    size=size, color=color, country=country, cart_id=cart_id,
                    tax_fee=(price * qty) * tax_rate,
                    service_fee=(price * qty) * service_fee_percentage,
                    total=(price * qty + shipping_amount * qty + (price * qty) * tax_rate + (price * qty) * service_fee_percentage)
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
        
        totals = {
            'shipping': sum(item.shipping_amount or Decimal('0') for item in queryset),
            'tax': sum(item.tax_fee or Decimal('0') for item in queryset),
            'service_fee': sum(item.service_fee or Decimal('0') for item in queryset),
            'sub_total': sum(item.sub_total or Decimal('0') for item in queryset),
            'total': sum(item.total or Decimal('0') for item in queryset),
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
            
            # Now uses correct '-date' ordering
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