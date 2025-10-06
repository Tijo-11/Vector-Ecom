from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, ProfileSerializer, UserSerializer
from .models import User
import random #noqa
from rest_framework.decorators import permission_classes
import shortuuid
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from django.conf import settings  # For GOOGLE_CLIENT_ID

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.otp = generate_otp()
        user.save()
        uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
        # TODO: Send email with OTP (e.g., using Django's send_mail)
        print(f"[DEBUG] Verification OTP for {user.email}: {user.otp}, uidb64: {uidb64}")
        return Response({
            "message": "User registered. OTP sent to email for verification.",
            "uidb64": uidb64
        }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def getRoutes(request):
    routes = ['/api/token/', '/api/register/', '/api/token/refresh/', 'api/test']
    return Response(routes)

class ProfileView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileSerializer

    def get_object(self):
        user_id = self.kwargs['user_id']
        try:
            user_id_int = int(user_id)
            if user_id_int <= 0:
                raise ValueError
        except ValueError:
            raise User.DoesNotExist
        user = User.objects.get(id=user_id_int)
        return user.profile

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
            pass
        if user:
            user.otp = generate_otp()
            user.save()
            if not isinstance(user.pk, int):
                raise ValueError(f"User ID {user.pk} is not an integer")
            uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
            otp = user.otp
            link = f"http://localhost:5173/create-new-password?otp={otp}&uidb64={uidb64}"
            print(f"[DEBUG] Password reset link for {email}: {link}")
        return Response({"message": "If this email exists, a reset link was sent."})

class PasswordChangeView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        payload = request.data
        otp = payload.get('otp')
        uidb64 = payload.get('uidb64')
        password = payload.get('password')
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user_id = int(user_id)
            user = User.objects.get(id=user_id, otp=otp)
        except (ValueError, User.DoesNotExist, TypeError):
            return Response({"message": "Invalid token or OTP"}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.otp = ""
        user.save()
        return Response({"message": "Password Changed Successfully"}, status=status.HTTP_200_OK)

class VerifyEmailOTP(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        payload = request.data
        otp = payload.get('otp')
        uidb64 = payload.get('uidb64')
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user_id = int(user_id)
            user = User.objects.get(id=user_id, otp=otp)
        except (ValueError, User.DoesNotExist, TypeError):
            return Response({"message": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        user.email_verified = True
        user.otp = ""
        user.save()
        return Response({"message": "Email verified successfully"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    credential = request.data.get('credential')
    if not credential:
        return Response({"error": "Credential not provided"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        id_info = google_id_token.verify_oauth2_token(credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
        email = id_info['email']
        full_name = id_info.get('name', '')
        email_username, _ = email.split('@')
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'username': email_username,
                'phone': '',  # Phone not available from Google; leave blank
            }
        )
        if created:
            user.set_unusable_password()  # No password for social users
        user.email_verified = id_info.get('email_verified', False)
        user.save()
        token = MyTokenObtainPairSerializer.get_token(user)
        return Response({
            "access": str(token.access_token),
            "refresh": str(token)
        }, status=status.HTTP_200_OK)
    except ValueError as e:#noqa
        return Response({"error": "Invalid credential"}, status=status.HTTP_400_BAD_REQUEST)