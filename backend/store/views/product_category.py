from rest_framework import generics
from rest_framework.permissions import AllowAny

from store.models import Category, Product
from store.serializers import CategorySerializer, ProductSerializer


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(active=True)
    permission_classes = (AllowAny,)
    pagination_class = None


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)

    ALLOWED_ORDERING = {"title", "-title", "price", "-price", "date", "-date"}

    def get_queryset(self):
        # Filter by published status and active vendor
        queryset = Product.objects.filter(status="published", vendor__active=True)
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        # Price range filters
        price_min = self.request.query_params.get("price_min")
        if price_min:
            try:
                queryset = queryset.filter(price__gte=float(price_min))
            except ValueError:
                pass

        price_max = self.request.query_params.get("price_max")
        if price_max:
            try:
                queryset = queryset.filter(price__lte=float(price_max))
            except ValueError:
                pass

        # Ordering
        ordering = self.request.query_params.get("ordering", "-date")
        if ordering in self.ALLOWED_ORDERING:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by("-date")

        return queryset


class FeaturedProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    # Filter by published status, featured flag, and active vendor
    queryset = Product.objects.filter(
        status="published", featured=True, vendor__active=True
    )[:3]
    permission_classes = (AllowAny,)


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)

    def get_object(self):
        slug = self.kwargs.get("slug")
        # Ensure product is published and vendor is active
        return Product.objects.get(slug=slug, status="published", vendor__active=True)
