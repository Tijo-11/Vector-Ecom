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

def get_active_user_cart(user):
    """Helper: Get user's active cart_id or None if none exists."""
    active_cart = Cart.objects.filter(user=user, is_active=True).first()
    return active_cart.cart_id if active_cart else None

class CartAPIView(generics.ListCreateAPIView):
    queryset = Cart.objects.filter(is_active=True)  # Always active
    serializer_class = CartSerializer
    permission_classes = (AllowAny,)
    
    def create(self, request, *args, **kwargs):
        try:
            payload = request.data
            # Validation
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
            
            # Service fee (hardcoded for now; swap with config if needed)
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
                cart.tax_fee = (price * qty) * tax_rate  # Per item tax
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
            
            return Response({"message": msg, "cart_id": cart.cart_id}, status=status.HTTP_201_CREATED if not cart.pk else status.HTTP_200_OK)
        
        except (ValueError, ValidationError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e: #noqa
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
        # Soft-delete: Set inactive instead of hard delete
        instance.is_active = False
        instance.save()
        # Or hard-delete: super().perform_destroy(instance)

class CartMergeAPIView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        try:
            user_id = request.data.get('user_id')
            anonymous_cart_id = request.data.get('cart_id')
            
            if not user_id:
                return Response({"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user_id = int(user_id)
                user = User.objects.get(id=user_id)
            except (ValueError, User.DoesNotExist):
                return Response({"error": "Invalid or not found user"}, status=status.HTTP_404_NOT_FOUND)
            
            # Get user's active cart_id
            user_cart_id = get_active_user_cart(user)
            
            if user_cart_id:
                # Merge anonymous into user's active cart
                if anonymous_cart_id:
                    anonymous_items = Cart.objects.filter(cart_id=anonymous_cart_id, user__isnull=True, is_active=True)
                    for anon_item in anonymous_items:
                        existing_item = Cart.objects.filter(
                            cart_id=user_cart_id, user=user, product=anon_item.product,
                            size=anon_item.size, color=anon_item.color, is_active=True
                        ).first()
                        
                        if existing_item:
                            # Merge qty
                            existing_item.qty += anon_item.qty
                            existing_item.sub_total = existing_item.price * existing_item.qty
                            existing_item.shipping_amount = (anon_item.shipping_amount or Decimal('0')) * existing_item.qty
                            
                            # Recalc tax/fee (reuse country from existing or anon)
                            country = existing_item.country or anon_item.country
                            tax_obj = Tax.objects.filter(country=country).first()
                            tax_rate = (tax_obj.rate / 100) if tax_obj else Decimal('0.05')
                            existing_item.tax_fee = existing_item.sub_total * tax_rate
                            existing_item.service_fee = existing_item.sub_total * Decimal('0.02')
                            existing_item.total = (existing_item.sub_total + existing_item.shipping_amount +
                                                   existing_item.service_fee + existing_item.tax_fee)
                            existing_item.save()
                            
                            # Deactivate anon
                            anon_item.is_active = False
                            anon_item.save()
                        else:
                            # Move to user cart
                            anon_item.cart_id = user_cart_id
                            anon_item.user = user
                            anon_item.save()
                    
                    # Deactivate remaining anon cart
                    Cart.objects.filter(cart_id=anonymous_cart_id, is_active=True).update(is_active=False)
                
                count = Cart.objects.filter(cart_id=user_cart_id, user=user, is_active=True).count()
                return Response({
                    "cart_id": user_cart_id,
                    "message": "Active user cart loaded/merged",
                    "start_new": False,  # Signal for frontend
                    "cart_count": count
                }, status=status.HTTP_200_OK)
            
            else:
                # No active user cart → associate anonymous or signal new
                if anonymous_cart_id:
                    # Move all to user (keep cart_id)
                    Cart.objects.filter(cart_id=anonymous_cart_id, is_active=True).update(user=user)
                    count = Cart.objects.filter(cart_id=anonymous_cart_id, user=user, is_active=True).count()
                    return Response({
                        "cart_id": anonymous_cart_id,
                        "message": "Anonymous cart associated with user",
                        "start_new": False,
                        "cart_count": count
                    }, status=status.HTTP_200_OK)
                else:
                    # No cart at all → start fresh (frontend generates new cart_id)
                    return Response({
                        "cart_id": None,
                        "message": "No active cart; start new",
                        "start_new": True,
                        "cart_count": 0
                    }, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:#noqa
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)