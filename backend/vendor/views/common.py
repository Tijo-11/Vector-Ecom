# Django Packages
import calendar
## Others Packages
import json
import urllib
from datetime import datetime
from datetime import datetime as d
from datetime import timedelta
from decimal import Decimal

import razorpay
import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.db import models, transaction
from django.db.models import Q
from django.db.models.functions import ExtractMonth
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
# Restframework Packages
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from addon.models import ConfigSettings, Tax
from store.models import (Address, Brand, CancelledOrder, Cart, CartOrder,
                          CartOrderItem, Category, Color, Coupon, CouponUsers,
                          DeliveryCouriers, Gallery, Notification, Product,
                          ProductFaq, Review, Size, Specification, Tag,
                          Wishlist)
from store.serializers import *
# Models
from userauth.models import Profile, User
# Serializers
from userauth.serializers import (MyTokenObtainPairSerializer,
                                  ProfileSerializer, RegisterSerializer)
from vendor.models import Vendor
