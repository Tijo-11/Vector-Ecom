# Django Packages

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

# Restframework Packages

from rest_framework.response import Response

from rest_framework import generics
from rest_framework.permissions import AllowAny#, IsAuthenticated

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

# Serializers
from userauth.serializers import  ProfileSerializer
from store.serializers import ProductSerializer, DeliveryCouriersSerializer, CartOrderItemSerializer

# Models
from userauth.models import Profile
from store.models import  CartOrderItem, Product, DeliveryCouriers
from vendor.models import Vendor

## Others Packages

from vendor.serializers import VendorSerializer
class VendorProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = (AllowAny, )
    parser_classes = (MultiPartParser, FormParser)


class ShopUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = (AllowAny, )      
    parser_classes = (MultiPartParser, FormParser)


class ShopAPIView(generics.RetrieveUpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = VendorSerializer
    permission_classes = (AllowAny, )

    def get_object(self):
        vendor_slug = self.kwargs['vendor_slug']

        vendor = Vendor.objects.get(slug=vendor_slug)
        return vendor
    

class ShopProductsAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_slug = self.kwargs['vendor_slug']
        vendor = Vendor.objects.get(slug=vendor_slug)
        products = Product.objects.filter(vendor=vendor)
        return products
    
class VendorRegister(generics.CreateAPIView):
    serializer_class = VendorSerializer
    queryset = Vendor.objects.all()
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        payload = request.data

        image = payload['image']
        name = payload['name']
        email = payload['email']
        description = payload['description']
        mobile = payload['mobile']
        user_id = payload['user_id']

        Vendor.objects.create(
            image=image,
            name=name,
            email=email,
            description=description,
            mobile=mobile,
            user_id=user_id,
        )

        return Response({"message":"Created vendor account"})
    

class CourierListAPIView(generics.ListAPIView):
    queryset = DeliveryCouriers.objects.all()
    serializer_class = DeliveryCouriersSerializer
    permission_classes = [AllowAny]

    

class OrderItemDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = CartOrderItemSerializer
    permission_classes = [AllowAny]
    queryset = CartOrderItem.objects.all()

    def get_object(self):
        pk = self.kwargs['pk']
        return CartOrderItem.objects.get(id=pk)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        instance.tracking_id = request.data.get('tracking_id', instance.tracking_id)

        delivery_couriers_id = request.data.get('delivery_couriers')
        delivery_couriers = DeliveryCouriers.objects.get(id=delivery_couriers_id)
        instance.delivery_couriers = delivery_couriers

        

        notify_buyer = request.data.get('notify_buyer')
        if notify_buyer == 'true':
            merge_data = {
                'instance': instance, 
                'tracking_id': instance.tracking_id, 
                'delivery_couriers': instance.delivery_couriers.name, 
                'tracking_link': f"{instance.delivery_couriers.tracking_website}?{instance.delivery_couriers.url_parameter}={instance.tracking_id}", 
            }
            subject = f"Tracking ID Added for {instance.product.title}"
            text_body = render_to_string("email/tracking_id_added.txt", merge_data)
            html_body = render_to_string("email/tracking_id_added.html", merge_data)
            
            msg = EmailMultiAlternatives(
                subject=subject, from_email=settings.FROM_EMAIL,
                to=[instance.order.email], body=text_body
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send()

        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MarkOrderAsDeliveredView(generics.UpdateAPIView):
    """
    Allows vendors to mark an order item as delivered.
    Updates product_delivered flag and delivery_status.
    """
    serializer_class = CartOrderItemSerializer
    permission_classes = [AllowAny]
    queryset = CartOrderItem.objects.all()

    def get_object(self):
        pk = self.kwargs['pk']
        return CartOrderItem.objects.get(id=pk)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Mark as delivered
        instance.product_delivered = True
        instance.delivery_status = "Delivered"
        instance.product_arrived = True  # Also mark as arrived
        
        instance.save()

        serializer = self.get_serializer(instance)
        return Response({
            "message": "Order item marked as delivered successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
