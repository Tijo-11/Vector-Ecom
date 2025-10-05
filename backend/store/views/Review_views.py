# Django Packages
from django.shortcuts import get_object_or_404

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
class SearchProductView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)
    
    def get_queryset(self):
        query = self.request.GET.get('query')
        if query is None:
            return Response({"message": "Query parameter can't be none"}, status= status.HTTP_400_BAD_REQUEST)
    
        product = Product.objects.filter(status='published', title__icontains=query)
        return product
        

    
