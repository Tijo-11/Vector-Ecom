# Django Packages
from django.shortcuts import get_object_or_404, redirect, render
from django.http import JsonResponse, HttpResponseNotFound, HttpResponse
from django.views import View

from django.utils.decorators import method_decorator

from django.views.decorators.csrf import csrf_exempt

from django.db.models import Q

from django.db import transaction


from django.urls import reverse

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail


from django.template.loader import render_to_string



# Restframework Packages
from rest_framework.decorators import api_view

from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics,status

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import  permission_classes

from rest_framework.views import APIView


# Serializers
from userauth.serializers import MyTokenObtainPairSerializer, RegisterSerializer
from store.serializers import CancelledOrderSerializer, CartSerializer, CartOrderItemSerializer, CouponUsersSerializer, ProductSerializer, TagSerializer ,CategorySerializer, DeliveryCouriersSerializer, CartOrderSerializer, GallerySerializer, BrandSerializer, ProductFaqSerializer, ReviewSerializer,  SpecificationSerializer, CouponSerializer, ColorSerializer, SizeSerializer, AddressSerializer, WishlistSerializer, ConfigSettingsSerializer

# Models
from userauth.models import User
from store.models import CancelledOrder, CartOrderItem, CouponUsers, Cart, Notification, Product, Tag ,Category, DeliveryCouriers, CartOrder, Gallery, Brand, ProductFaq, Review,  Specification, Coupon, Color, Size, Address, Wishlist
from addon.models import ConfigSettings, Tax
from vendor.models import Vendor

# Others Packages
import json
from decimal import Decimal
# import stripe
# import requests

# stripe.api_key = settings.STRIPE_SECRET_KEY
# PAYPAL_CLIENT_ID = settings.PAYPAL_CLIENT_ID
# PAYPAL_SECRET_ID = settings.PAYPAL_SECRET_ID