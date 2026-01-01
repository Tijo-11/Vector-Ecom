from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from store.models.offer import ProductOffer, CategoryOffer
from store.models import Product
from vendor.models import Vendor
from django.shortcuts import get_object_or_404

class ProductOfferListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor, id=vendor_id)
        return ProductOffer.objects.filter(products__vendor=vendor).distinct()

    def perform_create(self, serializer):
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor, id=vendor_id)
        product_ids = self.request.data.get('product_ids', [])
        products = Product.objects.filter(id__in=product_ids, vendor=vendor)
        if not products.exists():
            return Response({"error": "No valid products for this vendor"}, status=status.HTTP_400_BAD_REQUEST)
        offer = serializer.save()
        offer.products.set(products)

class ProductOfferDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (AllowAny,)

    def get_object(self):
        vendor_id = self.kwargs['vendor_id']
        pk = self.kwargs['pk']
        vendor = get_object_or_404(Vendor, id=vendor_id)
        return get_object_or_404(ProductOffer, id=pk, products__vendor=vendor)