from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    MyTokenObtainPairSerializer,
    RegisterSerializer,
    ProfileSerializer,
    UserSerializer,
)

from .models import User
import shortuuid
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from django.utils import timezone
import logging
from .tasks import send_async_email
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from store.models import Address
from store.serializers import AddressSerializer
logger = logging.getLogger(__name__)

token_generator = PasswordResetTokenGenerator()
def generate_otp():
    uuid_key = shortuuid.uuid()
    unique_key = uuid_key[:6]
    return unique_key

def mask_email(email: str) ->str:
    try:
        local, domain = email.split("@")
        masked_local = local[:2] + "***" if len(local)>0 else local[0]+"***"
        return f"{masked_local}@{domain}"
    except Exception:
        return "****@***"
    
    
    
class MyTokenObatianPairView(TokenObtainPairView):
    '''Thae base view handles the login endpoint: it validates credentials and 
    returns a JWT access and refresh token.'''
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        logger.info("Token request received")
        logger.info("Request contains data payload")
        logger.info(f"Has email: {'email' in request.data}")
        logger.info(f"Has password: {'password' in request.data}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Request method: {request.method}")
        
        try:
            response = super().post(request, *args, **kwargs)#runs the standard SimpleJWT logic:
#Deserialize the request data (email/password in your case).
#Validate credentials using your custom serializer.
#Generate JWT token
#Return a Response object containing those tokens.
            logger.info("Token generation successful")
            return response
        except Exception as e:
            logger.error(f"Token generation failed: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": str(e),
                    "detail": "Token generation failed",
                    "received_fields": list(request.data.keys()),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
            
"""
When Django imports userauth/views.py, Python executes all top-level code in order, 
including every def and class statement. The def generate_otp(): ... block is executed during module 
import, so the name generate_otp is bound in the module's global namespace before any views are e
ver called. Inside a class like RegisterView, the method post() contains a reference to generate_otp, 
but Python does not resolve that name when the class is defined. It only looks it up when the 
method is actually called (i.e., when a request hits the endpoint)."""
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class =RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response({
                "error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email = email)
            if user.email_verified:
                return Response(
                    { "error": "An account with this email already exists, please login."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                user.otp = generate_otp()
                user.save()
                uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
                subject = "Verify Your Email - RetroRelics"
                message = (
                    f"Hello {user.full_name or user.username},\n\n"
                    f"An OTP has been sent to verify your account.\n\n"
                    f"Your verification code is: {user.otp}\n\n"
                    f"This code is valid for 10 minutes.\n\n"
                    f"Thank you!"
                )
                send_async_email.delay(#Calling send_async_email(...) directly would run the email sending immediately,
                                       #in the same request/response cycle.
    #Calling send_async_email.delay(...) instead queues the task in your Celery broker 
    # (e.g., Redis or RabbitMQ).
                    subject = subject,
                    message = message,
                    from_email = settings.DEFAULT_FROM_EMAIL,
                    recipient_list = [user.email],
                    fail_silently= False
                )
                return Response(
                    {"message": "An account has been already registered with this email, please confirm the email to continue. OTP resent.",
                     "uidb64": uidb64,}, status=status.HTTP_200_OK        
                )
                
        # Normal registration for new email
        
        serializer = self.get_serializer(data= request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.otp = generate_otp()
        user.save()
        
        logger.info(f"User created successfully: {user.id} - {mask_email(user.email)}")
        uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
        #It generates a URL-safe, Base64-encoded version of the user’s ID
        #In password reset or email verification links, Django doesn’t expose raw user IDs.
        #Later, when the user clicks the link, Django decodes uidb64 back to the user ID to identify 
        # which account the reset/activation applies to.
        
        # Send verification email (only OTP, no link)
        subject = "Verify Your Email - RetroRelics"
        message = (
            f"Hello {user.full_name or 'User'},\n\n"
            f"Thank you for registering!\n\n"
            f"Your verification code is: {user.otp}\n\n"
            f"Please enter this code to complete registration.\n\n"
            f"This code is valid for 10 minutes.\n\n"
            f"Thank you!"
        )
        send_async_email.delay(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,#Django will raise an except
        )
        return Response(
            {
                "message": "User registered. OTP sent to email for verification.",
                "uidb64": uidb64,
                "user_id": user.id,
            },
            status=status.HTTP_201_CREATED,
        )
@api_view(["GET"])
def getRoutes(request):
    routes = ["/api/token/", "/api/register/", "/api/token/refresh/", "api/test"]
    return Response(routes)
        

            
        
