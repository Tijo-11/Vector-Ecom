# Django Packages
from django.shortcuts import get_object_or_404, redirect, render
from django.http import JsonResponse, HttpResponseNotFound, HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.db import models
from django.db import transaction
from django.urls import reverse
from django.conf import settings
from django.db.models.functions import ExtractMonth
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string

# Restframework Packages
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

# Serializers
from userauth.serializers import MyTokenObtainPairSerializer, ProfileSerializer, RegisterSerializer
from store.serializers import *

# Models
from userauth.models import Profile, User
from store.models import CancelledOrder, Notification, CartOrderItem, CouponUsers, Cart, Product, Tag, Category, DeliveryCouriers, CartOrder, Gallery, Brand, ProductFaq, Review,  Specification, Coupon, Color, Size, Address, Wishlist
from addon.models import ConfigSettings, Tax
from vendor.models import Vendor

## Others Packages
import json
from decimal import Decimal
import razorpay
import requests
from datetime import datetime, timedelta
import calendar
import urllib
import requests
from datetime import datetime as d