from .common import *
#presently I don't implement tax system, and other countries. But option for it is there.
#Models are already created, but no cart or order doesn't require countries
#Similarly size and color is also not needed as the products are not coming in much variation

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
        if user_id != "undefined":
            user = User.objects.filter(id=user_id).first()
        else:
            user = None
        #Tax model is in addon
        tax = Tax.objects.filter(country=country).first()
        if tax:
            tax_rate = tax.rate / 100
        else:
            tax_rate = 0
            
        cart = Cart.objects.filter(cart_id=cart_id, product=product).first()
        if cart:#set data from request to that cart object, 
            cart.product = product
            cart.user = user
            cart.qty = qty
            cart.price = price
            cart.sub_total = Decimal(price) * int(qty)
            cart.shipping_amount = Decimal(shipping_amount) * int(qty) #int(qty) because qty is a string
            cart.size = size
            cart.tax_fee = int(qty) * Decimal(tax_rate)# Decimal is imported in commin
            cart.color = color
            cart.country = country
            cart.cart_id = cart_id
            
            # config_settings = ConfigSettings.objects.first() #From Addon Models
            # if config_settings.service_fee_charge_type == "percentage":
            # service_fee_percentage = config_settings.service_fee_percentage / 100
            service_fee_percentage = 20 / 100
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
            cart.tax_fee = int(qty) * Decimal(tax_rate)
            cart.color = color
            cart.country = country
            cart.cart_id = cart_id
            
            #  config_settings = ConfigSettings.objects.first()

            # if config_settings.service_fee_charge_type == "percentage":
            # service_fee_percentage = config_settings.service_fee_percentage / 100
            service_fee_percentage = 20 / 100
            cart.service_fee = Decimal(service_fee_percentage) * cart.sub_total
            # else:
            #     cart.service_fee = config_settings.service_fee_flat_rate
            cart.total = cart.sub_total + cart.shipping_amount + cart.service_fee + cart.tax_fee
            cart.save()
            return Response({"message": "Cart updated successfully"}, status=status.HTTP_200_OK)
        
    