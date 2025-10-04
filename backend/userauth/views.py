#Django
from django.shortcuts import render
#render is a Django helper that combines a template with a context dictionary and returns an HTTP response.
# Renders HTML template with context data as HTTP response
from django.http import JsonResponse
#JsonResponse is used to send JSON data as an HTTP response, typically for APIs or AJAX calls.
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str


#Restframework
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import NotFound


#Serializers and Models
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, ProfileSerializer, UserSerializer
from .models import User, Profile
#others
import json
#json is Python’s built-in module for encoding and decoding JSON data.
import random
import shortuuid

# This code defines a DRF View class called MyTokenObtainPairView, which inherits from TokenObtainPairView.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    #serializer_class is a reserved attribute name that tells the view which serializer to use.
    
# This code defines another DRF View class called RegisterView, which inherits from generics.CreateAPIView.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
# This is a DRF view defined as a Python function using the @api_view decorator.
#This function is not routing logic—it's a view that returns a list of available API endpoints. Think of it like 
# an API index page or a manual route listing. When you hit /api/ (or wherever it's mapped), this view responds
# with a list of useful routes—helpful for frontend devs, testing, or documentation.
#It’s often used in early-stage development or public APIs to give clients a quick overview of available endpoints.
@api_view(['GET'])
# Marks this function as a Django REST Framework view that only accepts GET requests. This decorator from Django 
# REST Framework simply wraps a regular function and gives it API view capabilities like request parsing, 
# authentication, and response formatting. It keeps the view as a function, just makes it behave like a DRF view.
def getRoutes(request):
     # It defines a list of API routes that can be accessed.
     routes=[
         '/api/token/', '/api/register/', '/api/token/refresh/', 'api/test'
     ]
     return Response(routes)
 
# This code defines another DRF View class called ProfileView, which inherits from generics.RetrieveAPIView
# and used to show user profile view
class ProfileView(generics.RetrieveAPIView):
#RetrieveAPIView is a DRF generic view for fetching a single model instance by its ID (GET /<id>/).
#It handles:GET requests, Looks up the object using the lookup_field (default is pk)
#Returns serialized data of that object. Just plug in your queryset and serializer_class, and you're good to go
    permission_classes = (AllowAny,)
    serializer_class = ProfileSerializer
    
    def get_object(self):
        user_id = self.kwargs['user_id']
#self.kwargs['user_id']: accesses the URL parameters passed to the view (like /profile/123/
#self does not refer to the request itself, but through self, you can access the request via self.request.
#self.serializer_class: refers to the serializer defined in the class
        user = User.objects.get(id=user_id)
        profile = Profile.objects.get(user=user)
        return profile#This is used inside get_object(), which is a helper method, not a view method.
    #Its job is to fetch and return the model instance, not the HTTP response.
    #If you wrote: return Response(profile)inside get_object(), you'd be returning a Response object instead
    # of the actual Profile model instance—which would break the logic of views like RetrieveAPIView, which expect
    # get_object() to return a model, not a response. get_object() → returns a model instance (e.g. Profile)
    #Response(...) → used in view methods like get() to return serialized data to the client
    def generate_numeric_otp(length=7):
        # Generate a random 7-digit OTP
        otp=''.join([str(random.randint(0,9)) for _ in range (length)])
        return otp
#The view is not exposing sensitive profile data, but instead using the profile lookup as part of a public OTP 
# generation flow. it may be used in a login, registration, or password reset process—where the user isn't 
# authenticated yet.AllowAny lets unauthenticated users access this endpoint, which is necessary if you're 
# sending OTPs to users before login.

import shortuuid
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from userauth.models import User
from userauth.serializers import UserSerializer


from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
import shortuuid

def generate_otp():
    uuid_key = shortuuid.uuid()
    unique_key = uuid_key[:6]
    return unique_key

class PasswordEmailVerify(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        email = self.kwargs.get("email")
        user = None

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            pass  # Do nothing if user not found
     # for password reset flows, it is good to return a success response even if the email doesn’t exist,
    # to prevent user enumeration attacks.

        if user:
            user.otp = generate_otp()
            user.save()

            # Ensure user.pk is an integer before encoding
            if not isinstance(user.pk, int):
                raise ValueError(f"User ID {user.pk} is not an integer")
            uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
            otp = user.otp
            link = f"http://localhost:5173/create-new-password?otp={otp}&uidb64={uidb64}"

            # TODO: send email with `link`
            print(f"[DEBUG] Password reset link for {email}: {link}")

        # Always return safe response
        return Response({"message": "If this email exists, a reset link was sent."})
    
#*********************************************************************************************************###
class PasswordChangeView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        payload = request.data
        otp = payload.get('otp')
        uidb64 = payload.get('uidb64')
        password = payload.get('password')

        try:
            # Decode uidb64 -> user_id
            user_id = force_str(urlsafe_base64_decode(uidb64))
            # Ensure user_id is a valid integer
            user_id = int(user_id)  # Will raise ValueError if not an integer
            user = User.objects.get(id=user_id, otp=otp)
        except (ValueError, User.DoesNotExist, TypeError):
            return Response(
                {"message": "Invalid token or OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user.set_password(password)
        user.otp = ""
        user.save()

        return Response(
            {"message": "Password Changed Successfully"},
            status=status.HTTP_200_OK   # ✅ return 200 instead of 201
        )
        



        
    
    
    









