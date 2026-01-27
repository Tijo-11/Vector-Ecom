from rest_framework import generics
from store.serializers import ProductSerializer, CategorySerializer
from store.models import Product, Category
from rest_framework.permissions import AllowAny

class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(active=True)
    permission_classes = (AllowAny,)
    pagination_class = None

class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        # Filter by published status and active vendor
        queryset = Product.objects.filter(status='published', vendor__active=True)
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset

class FeaturedProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    # Filter by published status, featured flag, and active vendor
    queryset = Product.objects.filter(status="published", featured=True, vendor__active=True)[:3]
    permission_classes = (AllowAny,)

class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)

    def get_object(self):
        slug = self.kwargs.get('slug')
        # Ensure product is published and vendor is active
        return Product.objects.get(slug=slug, status='published', vendor__active=True)