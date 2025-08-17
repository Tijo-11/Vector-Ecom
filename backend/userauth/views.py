#Django
from django.shortcuts import render
#render is a Django helper that combines a template with a context dictionary and returns an HTTP response.
# Renders HTML template with context data as HTTP response
from django.http import JsonResponse
#JsonResponse is used to send JSON data as an HTTP response, typically for APIs or AJAX calls.






#Restframework
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import AllowAny

#Serializers and Models
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer
from .models import User, Profile
#others
import json
#json is Python’s built-in module for encoding and decoding JSON data.
import random

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    #serializer_class is a reserved attribute name that tells the view which serializer to use.
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer






