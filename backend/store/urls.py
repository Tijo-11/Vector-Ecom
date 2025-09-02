from django.urls import path
from .views.product_category import CategoryListView, ProductListView, FeaturedProductListView, ProductDetailView
from .views.cart_views import CartAPIView, CartListView, CartDetailView, CartItemDeleteAPIView
from .views.order_views import CreateOrderView, CheckoutView

urlpatterns = [
    path('category/', CategoryListView.as_view(), name="category"),
    path('products/', ProductListView.as_view(), name= "products"),
    path('featured-products/', FeaturedProductListView.as_view(), name='featured-products'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='brand'),
    path('cart/', CartAPIView.as_view(), name="cart-view"),
    path('cart-list/<str:cart_id>/<int:user_id>/', CartListView.as_view(), name="cart-list-view"),
    path('cart-list/<str:cart_id>/', CartListView.as_view(), name="cart-list-view"),
    #If unauthenticated or registered user places order to handle order this url is used, we don't need 
    #new view for it
    path('cart-detail/<str:cart_id>/', CartDetailView.as_view(), name='cart-detail'),
    ###
    path('cart-delete/<str:cart_id>/<int:item_id>/<int:user_id>/', CartItemDeleteAPIView.as_view(), name="cart-delete"),
    path('cart-delete/<str:cart_id>/<int:item_id>/', CartItemDeleteAPIView.as_view(), name='cart-delete'),
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('checkout/<order_oid>/', CheckoutView.as_view(), name='checkout'),
    
]