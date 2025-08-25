from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from store.models import CancelledOrder, Cart, CartOrderItem, Notification, CouponUsers, Product, Tag 
from store.models import Category, DeliveryCouriers, CartOrder, Gallery, Brand, ProductFaq, Review
from store.models import Specification, Coupon, Color, Size, Address, Wishlist, Gallery
###############

from vendor.models import Vendor

from vendor.serializers import VendorSerializer
from userauth.serializers import ProfileSerializer, UserSerializer

class ConfigSettingsSerializer(serializers.ModelSerializer):
    class Meta:
            model = ConfigSettings
            fields = '__all__'


