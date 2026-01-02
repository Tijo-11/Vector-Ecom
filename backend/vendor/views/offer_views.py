# vendor/views/offer_views.py (fixed with better error handling)
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from store.models.offer import ProductOffer
from store.serializers import ProductOfferSerializer
from store.models import Product
from vendor.models import Vendor
from django.shortcuts import get_object_or_404
import logging
from rest_framework import serializers

logger = logging.getLogger(__name__)

class ProductOfferListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProductOfferSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor, id=vendor_id)
        return ProductOffer.objects.filter(vendor=vendor).order_by('-id')

    def perform_create(self, serializer):
        logger.info(f"Creating offer with validated data: {serializer.validated_data}")
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor, id=vendor_id)

        # Pop product_ids from validated_data before saving
        product_ids = serializer.validated_data.pop('product_ids', [])
        logger.info(f"Received product_ids: {product_ids}")

        if not product_ids:
            raise serializers.ValidationError({"product_ids": "At least one product must be selected."})

        products = Product.objects.filter(id__in=product_ids, vendor=vendor)
        if not products.exists():
            raise serializers.ValidationError({"product_ids": "No valid products selected for this vendor."})

        # Save the offer with vendor
        offer = serializer.save(vendor=vendor)
        offer.products.set(products)
        logger.info(f"Offer created successfully: ID {offer.id}")

    def post(self, request, *args, **kwargs):
        logger.info(f"POST data received: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class ProductOfferDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductOfferSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor, id=vendor_id)
        return ProductOffer.objects.filter(vendor=vendor)

    def get_object(self):
        return super().get_object()