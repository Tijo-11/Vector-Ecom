from rest_framework import generics
from store.serializers import   ProductSerializer, CategorySerializer# Models
from store.models import  Product,Category
from rest_framework.permissions import AllowAny#, IsAuthenticated

# Others Packages



class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(active=True)
    permission_classes =  (AllowAny,)
    
class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(status='published')
    permission_classes = (AllowAny,)
    

class FeaturedProductListView(generics.ListAPIView):

    serializer_class = ProductSerializer
    queryset = Product.objects.filter(status="published", featured=True)[:3]
    permission_classes = (AllowAny,)
    
class ProductDetailView(generics.RetrieveAPIView):

    serializer_class = ProductSerializer
    permission_classes =(AllowAny,)
    
    def get_object(self):
        slug = self.kwargs.get('slug')

        return Product.objects.get(slug=slug)
    
