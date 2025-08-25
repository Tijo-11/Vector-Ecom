# Django Packages
from django.shortcuts import get_object_or_404, redirect, render
from django.http import JsonResponse, HttpResponseNotFound, HttpResponse## Import HTTP response classes for returning JSON, plain text, or 404 errors in views
from django.views import View
# Import the base class for creating class-based views in Django. This lets you define views using Python classes
# instead of functions, which is great for organizing logic, especially when handling multiple HTTP methods like GET, POST, etc.
from django.utils.decorators import method_decorator
# Import method_decorator to apply function-based decorators to class-based views. This is especially useful when
# you want to use decorators like @login_required, @csrf_exempt, or custom ones on methods inside a class-based view.
from django.views.decorators.csrf import csrf_exempt
## Import csrf_exempt to disable CSRF protection on specific views. This decorator is useful when you're building
# APIs or handling requests from external sources that don't include CSRF tokens. But use it with caution—
# disabling CSRF protection can expose your app to security risks if not handled properly.
from django.db.models import Q
# Import Q objects to build complex queries with OR, AND, and NOT logic
from django.db import transaction
# Import transaction management tools for atomic operations in Django
#This lets you wrap database operations in a transaction block, ensuring that either all changes succeed or 
# none are applied—perfect for maintaining data integrity.
#You can also use transaction.on_commit() to trigger actions only after a successful commit.
from django.urls import reverse
# Import reverse to dynamically generate URLs from view names
#reverse() is a powerful Django utility that lets you build URLs based on the name of a view, rather than 
# hardcoding paths. This makes your code more maintainable and less error-prone—especially when URLs change.
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
## Import tools to send emails; send_mail for simple messages, EmailMultiAlternatives for rich content 
# (HTML + plain text)Use send_mail for quick plain-text emails. Use EmailMultiAlternatives when you need both 
# plain text and HTML versions, attachments, or more control over headers.
'''
send_mail(
    subject='Hello!',
    message='Plain text body',
    from_email='from@example.com',
    recipient_list=['to@example.com'],
)
Example with EmailMultiAlternatives:

python
email = EmailMultiAlternatives(
    subject='Hello!',
    body='Plain text body',
    from_email='from@example.com',
    to=['to@example.com'],
)
email.attach_alternative('<p>HTML body</p>', 'text/html')
email.send()'''
from django.template.loader import render_to_string
## Import render_to_string to generate HTML or text content from Django templates
#This is your go-to tool when you want to dynamically generate email bodies, web content, or any string-based
# output using Django templates.
#context = {'username': 'Arjun', 'activation_link': 'https://example.com/activate'}
# html_content = render_to_string('emails/welcome.html', context)
#This will load the welcome.html template from your templates/emails/ directory and fill in the placeholders
# using the context dictionary.
'''
You can then plug html_content into an EmailMultiAlternatives message like this:

python
email = EmailMultiAlternatives(
    subject='Welcome to Our Site!',
    body='Thanks for joining us!',
    from_email='noreply@example.com',
    to=['arjun@example.com'],
)
email.attach_alternative(html_content, 'text/html')
email.send()'''


# Restframework Packages
from rest_framework.decorators import api_view
## Import the api_view decorator to define function-based views in Django REST Framework
#This decorator lets you specify which HTTP methods your view should respond to—like GET, POST, PUT, 
# etc.—and automatically wraps your function in Django REST Framework’s request/response handling.
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics,status
# Import generic class-based views from Django REST Framework
#This gives you access to powerful, ready-made views like ListAPIView, CreateAPIView,
# RetrieveUpdateDestroyAPIView, and more—perfect for building RESTful endpoints with minimal boilerplate.
#Saves time: No need to write repetitive logic, Built-in support for pagination, filtering, permissions,
#Easy to customize with mixins or method overrides
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import  permission_classes
## Import the permission_classes decorator to apply permission rules to function-based views
#This decorator is used alongside @api_view to enforce access control on function-based views in Django REST 
# Framework. It lets you specify which user roles or authentication levels are allowed to access the endpoint.
from rest_framework.views import APIView
## Import APIView to create custom class-based views in Django REST Framework
#APIView is your gateway to building fully customized class-based views in Django REST Framework.
# Unlike generic views, it gives you complete control over request handling, authentication, permissions, and response formatting.

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