from rest_framework import generics, status, serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging

from store.models.offer import ProductOffer, CategoryOffer
from store.serializers import ProductOfferSerializer, CategoryOfferSerializer
from store.models import Product, Category
from vendor.models import Vendor

logger = logging.getLogger(__name__)


# ===================== COMMON DISCOUNT VALIDATION =====================
def validate_discount_percentage(discount):
    """
    Enforces: 0 < discount < 100
    Allows decimal values (e.g., 12.5)
    """
    if discount is None:
        return

    try:
        discount = float(discount)
    except (TypeError, ValueError):
        raise serializers.ValidationError(
            {"discount_percentage": "Discount percentage must be a valid number."}
        )

    if discount <= 0 or discount >= 100:
        raise serializers.ValidationError(
            {"discount_percentage": "Discount percentage must be greater than 0 and less than 100."}
        )


# ===================== PRODUCT OFFER VIEWS =====================
class ProductOfferListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProductOfferSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor = get_object_or_404(Vendor, id=self.kwargs["vendor_id"])
        return ProductOffer.objects.filter(vendor=vendor).order_by("-id")

    def perform_create(self, serializer):
        now = timezone.now()
        vendor = get_object_or_404(Vendor, id=self.kwargs["vendor_id"])

        logger.info(f"Creating product offer with data: {serializer.validated_data}")

        # 🔒 STRICT DISCOUNT VALIDATION (DECIMAL ALLOWED)
        validate_discount_percentage(
            serializer.validated_data.get("discount_percentage")
        )

        product_ids = serializer.validated_data.pop("product_ids", [])
        if not product_ids:
            raise serializers.ValidationError(
                {"product_ids": "At least one product must be selected."}
            )

        if not serializer.validated_data.get("start_date"):
            serializer.validated_data["start_date"] = now

        products = Product.objects.filter(id__in=product_ids, vendor=vendor)
        if not products.exists():
            raise serializers.ValidationError(
                {"product_ids": "No valid products selected for this vendor."}
            )

        offer = serializer.save(vendor=vendor)
        offer.products.set(products)

        logger.info(f"Product offer created: ID {offer.id}")

    def post(self, request, *args, **kwargs):
        logger.info(f"Product offer POST data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductOfferDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductOfferSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor = get_object_or_404(Vendor, id=self.kwargs["vendor_id"])
        return ProductOffer.objects.filter(vendor=vendor)

    def perform_update(self, serializer):
        # 🔒 STRICT DISCOUNT VALIDATION (DECIMAL ALLOWED)
        validate_discount_percentage(
            serializer.validated_data.get("discount_percentage")
        )

        product_ids = serializer.validated_data.pop("product_ids", None)
        offer = serializer.save()

        if product_ids is not None:
            if not product_ids:
                raise serializers.ValidationError(
                    {"product_ids": "At least one product must be selected."}
                )

            vendor = offer.vendor
            products = Product.objects.filter(id__in=product_ids, vendor=vendor)
            if not products.exists():
                raise serializers.ValidationError(
                    {"product_ids": "No valid products selected for this vendor."}
                )

            offer.products.set(products)


# ===================== CATEGORY OFFER VIEWS =====================
class CategoryOfferListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = CategoryOfferSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor = get_object_or_404(Vendor, id=self.kwargs["vendor_id"])
        return CategoryOffer.objects.filter(vendor=vendor).order_by("-id")

    def perform_create(self, serializer):
        now = timezone.now()
        vendor = get_object_or_404(Vendor, id=self.kwargs["vendor_id"])

        logger.info(f"Creating category offer with data: {serializer.validated_data}")

        # 🔒 STRICT DISCOUNT VALIDATION (DECIMAL ALLOWED)
        validate_discount_percentage(
            serializer.validated_data.get("discount_percentage")
        )

        category_ids = serializer.validated_data.pop("category_ids", [])
        if not category_ids:
            raise serializers.ValidationError(
                {"category_ids": "At least one category must be selected."}
            )

        if not serializer.validated_data.get("start_date"):
            serializer.validated_data["start_date"] = now

        categories = Category.objects.filter(id__in=category_ids)
        if not categories.exists():
            raise serializers.ValidationError(
                {"category_ids": "No valid categories selected."}
            )

        offer = serializer.save(vendor=vendor)
        offer.categories.set(categories)

        logger.info(f"Category offer created: ID {offer.id}")

    def post(self, request, *args, **kwargs):
        logger.info(f"Category offer POST data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryOfferDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategoryOfferSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor = get_object_or_404(Vendor, id=self.kwargs["vendor_id"])
        return CategoryOffer.objects.filter(vendor=vendor)

    def perform_update(self, serializer):
        # 🔒 STRICT DISCOUNT VALIDATION (DECIMAL ALLOWED)
        validate_discount_percentage(
            serializer.validated_data.get("discount_percentage")
        )

        category_ids = serializer.validated_data.pop("category_ids", None)
        offer = serializer.save()

        if category_ids is not None:
            if not category_ids:
                raise serializers.ValidationError(
                    {"category_ids": "At least one category must be selected."}
                )

            categories = Category.objects.filter(id__in=category_ids)
            if not categories.exists():
                raise serializers.ValidationError(
                    {"category_ids": "No valid categories selected."}
                )

            offer.categories.set(categories)
