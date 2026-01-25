# Django Packages
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import IntegrityError
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.core.exceptions import PermissionDenied


# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics,status

# Serializers
from store.serializers import   ProductSerializer, ReviewSerializer
# Models

from store.models import  Product, Review
# Others Packages
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from store.models import CartOrder

from rest_framework.permissions import  AllowAny


 # Assuming CartOrder is your main order model
# If your order items model is different (e.g., CartOrderItems), import it too

class ReviewListAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        product = get_object_or_404(Product, id=product_id)
        # Only show active reviews
        return Review.objects.filter(product=product, active=True).order_by('-date')

    def create(self, request, *args, **kwargs):
        user = request.user
        product_id = self.kwargs['product_id']

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Purchase check
        has_purchased = CartOrder.objects.filter(
            buyer=user,
            payment_status="paid"
        ).filter(
            orderitem__product=product
        ).exists()

        if not has_purchased:
            return Response(
                {"error": "You can only review products you have purchased."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create or update via serializer (unique_together will prevent duplicates)
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            # Force active=True and set user/product
            review_instance = serializer.save(user=user, product=product, active=True)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        
        except IntegrityError:
            # Handle duplicate attempt gracefully
            return Response(
                {"error": "You have already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST
            )







#Searchview
class SearchProductView(generics.ListAPIView):  # Changed to ListAPIView (no need for Create)
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        queryset = Product.objects.filter(status='published')

        # Text search query (optional)
        query = self.request.GET.get('query')
        if query:
            # Search in both title and description for better results
            queryset = queryset.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )

        # Category filter (supports multiple categories: ?category=1&category=2)
        category_ids = self.request.GET.getlist('category')
        if category_ids:
            queryset = queryset.filter(category__id__in=category_ids)

        # Price range filters
        price_min = self.request.GET.get('price_min')
        if price_min:
            try:
                queryset = queryset.filter(price__gte=float(price_min))
            except ValueError:
                pass  # Ignore invalid price_min

        price_max = self.request.GET.get('price_max')
        if price_max:
            try:
                queryset = queryset.filter(price__lte=float(price_max))
            except ValueError:
                pass  # Ignore invalid price_max

        # Optional: order results (e.g., newest first, or by relevance)
        # You can change this as needed
        queryset = queryset.order_by('-date')  # or '-price', 'title', etc.

        return queryset

    # Optional: handle empty results gracefully (but frontend already handles it)
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists() and not request.GET:
            # If no filters at all, still return empty list (frontend shows welcome message)
            pass
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)  

    


class HasPurchasedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        user = request.user

        # FIXED: Use 'orderitem' related_name
        has_purchased = CartOrder.objects.filter(
            buyer=user,
            payment_status="paid"
        ).filter(
            orderitem__product__id=product_id
        ).exists()

        return Response({"has_purchased": has_purchased})
    

class ReviewDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, Update (PATCH), or Delete a single review.
    Only the author can update or delete their own review.
    """
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'pk'

    def get_queryset(self):
        # Only return active reviews
        return Review.objects.filter(active=True)

    def get_object(self):
        pk = self.kwargs['pk']
        review = get_object_or_404(Review, id=pk)
        return review

    def perform_update(self, serializer):
        # Only allow author to update
        if serializer.instance.user != self.request.user:
            raise PermissionDenied("You can only edit your own reviews.")
        serializer.save()

    def perform_destroy(self, instance):
        # Only allow author to delete
        if instance.user != self.request.user:
            raise PermissionDenied("You can only delete your own reviews.")
        instance.delete()  # Or set active=False if you prefer soft delete