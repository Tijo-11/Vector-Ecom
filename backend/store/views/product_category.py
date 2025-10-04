from .common import *


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
# Class-based view to retrieve a single Product instance by ID or slug
#This view handles GET requests and returns details of one product. It expects a queryset and serializer_class 
# to be defined, and typically uses a URL pattern like /products/<pk>/.
    serializer_class = ProductSerializer
    
    def get_object(self):
        # Retrieve the product using the provided slug from the URL
        slug = self.kwargs.get('slug')
# URL parameters (like <slug>) are passed into the view instance 
# via self.kwargs. So self.kwargs.get('slug') fetches the value from the URL pattern.
        return Product.objects.get(slug=slug)
    
