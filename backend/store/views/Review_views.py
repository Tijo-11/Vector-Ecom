# Django Packages
from django.shortcuts import get_object_or_404
from django.db.models import Q

# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics,status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
# Serializers
from store.serializers import   ProductSerializer, ReviewSerializer
# Models
from userauth.models import User
from store.models import  Product, Review
# Others Packages


class ReviewListAPIView(generics.ListCreateAPIView):#List view and Create view together
    # queryset = Review.objects.all() # it is overriden
    serializer_class = ReviewSerializer
    permission_classes = (AllowAny,)
    
    def get_queryset(self):
        #  """
        # Safely get reviews for a product.
        # If product doesn't exist, return 404 automatically.
        # """
        product_id = self.kwargs['product_id']# grab product id from url
        
        product = get_object_or_404(Product, id=product_id)
        #product= Products.objects.get(id =product_id) is not as per DRF best practices as it will raise errors
        #user get_object_or_404() function instead
        reviews = Review.objects.filter(product=product)
        return reviews
    
    # create Review
    def create(self, request, *args, **kwargs):
        permission_classes = (IsAuthenticatedOrReadOnly,) #noqa
        payload = request.data
        user_id = payload['user_id']
        product_id = payload['product_id']
        rating = payload['rating']
        review = payload['review'] #This is not as per best practices of DRF
        if not user_id or user_id == 'undefined':
            return Response({"error": "Invalid user_id"}, status=status.HTTP_400_BAD_REQUEST)
        if not product_id or product_id == 'undefined':
            return Response({"error": "Invalid product_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        
        
        user = get_object_or_404(User, id=user_id)
        product = Product.objects.get(id=product_id)
        
        Review.objects.create(user=user, product=product, rating=rating, review=review)
        
        return Response({"meassage": "Review Created Successfully"}, status=status.HTTP_201_CREATED,)
    
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

    
