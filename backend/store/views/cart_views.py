from .common import *


class CartAPIView(generics.ListCreateAPIView):# Handles GET (list) and POST (create) for Cart items
    #Ideal for exposing cart data via API—clients can fetch all cart items or add new ones.
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    permission_classes = (AllowAny,)
    
    def create(self, request, *args, **kwargs):
        payload = request.data
        product_id = payload['product']
        user_id = payload['user']
        qty = payload['qty']
        price = payload['price']
        shipping_amount = payload['shipping_amount']
        country = payload['country']
        size = payload['size']
        color = payload['color']
        cart_id = payload['cart_id']
        product = Product.objects.filter(status="published", id=product_id).first()
        if user_id and user_id.isdigit():
            user = User.objects.filter(id=user_id).first()
        else:
            user = None
        #Tax model is in addon
        tax = Tax.objects.filter(country=country).first()
        if tax:
            tax_rate = tax.rate/100
        else:
            tax_rate = 5/100
            
        cart = Cart.objects.filter(cart_id=cart_id, product=product).first()
        if cart:#set data from request to that cart object, 
            cart.product = product
            cart.user = user
            cart.qty = qty
            cart.price = price
            cart.sub_total = Decimal(price) * int(qty)
            cart.shipping_amount = Decimal(shipping_amount) * int(qty) #int(qty) because qty is a string
            cart.size = size
            cart.tax_fee = Decimal(cart.price) * Decimal(tax_rate)# Decimal is imported in commin
            cart.color = color
            cart.country = country
            cart.cart_id = cart_id
            
            # config_settings = ConfigSettings.objects.first() #From Addon Models
            # if config_settings.service_fee_charge_type == "percentage":
            # service_fee_percentage = config_settings.service_fee_percentage / 100
            service_fee_percentage = 2 / 100
            cart.service_fee = Decimal(service_fee_percentage) * cart.sub_total
            # else:
            #     cart.service_fee = config_settings.service_fee_flat_rate
            cart.total = cart.sub_total + cart.shipping_amount + cart.service_fee + cart.tax_fee
            cart.save()
            return Response({"message": "Cart updated successfully"}, status=status.HTTP_200_OK)
        else:
            cart = Cart()
            cart.product = product
            cart.user = user
            cart.qty = qty
            cart.price = price
            cart.sub_total = Decimal(price) * int(qty)
            cart.shipping_amount = Decimal(shipping_amount) * int(qty)
            cart.size = size
            cart.tax_fee = Decimal(cart.price) * Decimal(tax_rate)
            cart.color = color
            cart.country = country
            cart.cart_id = cart_id
            
            #  config_settings = ConfigSettings.objects.first()

            # if config_settings.service_fee_charge_type == "percentage":
            # service_fee_percentage = config_settings.service_fee_percentage / 100
            service_fee_percentage = 2 / 100
            cart.service_fee = Decimal(service_fee_percentage) * cart.sub_total
            # else:
            #     cart.service_fee = config_settings.service_fee_flat_rate
            cart.total = cart.sub_total + cart.shipping_amount + cart.service_fee + cart.tax_fee
            cart.save()
            return Response({"message": "Cart updated successfully"}, status=status.HTTP_200_OK)
        
##-------------------------------------------------------------------------------------
class CartListView(generics.ListAPIView):
    serializer_class = CartSerializer
    permission_classes = (AllowAny,)
    queryset = Cart.objects.all()
    
    def get_queryset(self):  # Overriding default queryset
        cart_id = self.kwargs['cart_id']
        user_id = self.kwargs.get('user_id')
        
        if user_id is not None:
            user = User.objects.filter(id=user_id).first()  # Get single user or None
            if user:
                queryset = Cart.objects.filter(user=user, cart_id=cart_id)
            else:
                queryset = Cart.objects.none()  # Return empty queryset if user not found
        else:
            queryset = Cart.objects.filter(cart_id=cart_id)
        return queryset
            

class CartDetailView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]
    lookup_field = 'cart_id'

    def get_queryset(self):
        cart_id = self.kwargs.get('cart_id')
        user_id = self.kwargs.get('user_id')
        if user_id is not None:
            user = User.objects.filter(id=user_id).first()
            return Cart.objects.filter(cart_id=cart_id, user=user)
        return Cart.objects.filter(cart_id=cart_id)

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        total_shipping = 0.0
        total_tax = 0.0
        total_service_fee = 0.0
        total_sub_total = 0.0
        total_total = 0.0

        for cart_item in queryset:
            total_shipping += float(self.calculate_shipping(cart_item))
            total_tax += float(self.calculate_tax(cart_item))
            total_service_fee += float(self.calculate_service_fee(cart_item))
            total_sub_total += float(self.calculate_subtotal(cart_item))
            total_total += float(self.calculate_total(cart_item))

        data = {
            'shipping': total_shipping,
            'tax': total_tax,
            'service_fee': total_service_fee,
            'sub_total': total_sub_total,
            'total': total_total,
        }
        return Response(data)

    def calculate_shipping(self, cart_item):
        return cart_item.shipping_amount or 0.0

    def calculate_tax(self, cart_item):
        return cart_item.tax_fee or 0.0

    def calculate_service_fee(self, cart_item):
        return cart_item.service_fee or 0.0

    def calculate_subtotal(self, cart_item):
        return cart_item.sub_total or 0.0

    def calculate_total(self, cart_item):
        return cart_item.total or 0.0
    
#________________CartItemDelete
class CartItemDeleteAPIView(generics.DestroyAPIView):
    serializer_class = CartSerializer
    lookup_field = "cart_id"
    
    def get_object(self):
        cart_id = self.kwargs["cart_id"]
        item_id = self.kwargs["item_id"]
        try:
            user_id = self.kwargs.get("user_id")
        except:
            pass
        if user_id:
            user = User.objects.get(id= user_id)
            cart = Cart.objects.get(id=item_id, cart_id= cart_id , user=user)
        else:
            cart = Cart.objects.get(id=item_id, cart_id = cart_id)
            
        return cart
            
    
        
    