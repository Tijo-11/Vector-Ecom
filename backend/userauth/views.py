# userauth/views.py 

from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError  # <-- NEW IMPORT
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

# For secure password reset token
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from store.models import Address
from store.serializers import AddressSerializer

# NEW IMPORT FOR VENDOR BLOCK CHECK
from vendor.models import Vendor

logger = logging.getLogger(__name__)

token_generator = PasswordResetTokenGenerator()

def mask_email(email: str) -> str:
    try:
        local, domain = email.split("@")
        # Keep first 2 characters of local part, mask the rest
        masked_local = local[:2] + "***" if len(local) > 2 else local[0] + "***"
        return f"{masked_local}@{domain}"
    except Exception:
        return "***@***"  # fallback if email is malformed


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        logger.info("Token request received")
        logger.info("Request contains data payload")
        logger.info(f"Has email: {'email' in request.data}")
        logger.info(f"Has password: {'password' in request.data}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Request method: {request.method}")

        try:
            response = super().post(request, *args, **kwargs)
            logger.info("Token generation successful")
            return response
        except ValidationError:
            # Re-raise ValidationError (including our blocked vendor message) 
            # so DRF returns the correct {"detail": "..."} with the original message
            raise
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


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            if user.email_verified:
                return Response(
                    {
                        "error": "An account with this email already exists, please login."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                # Resend OTP for unverified account
                user.otp = generate_otp()
                user.save()
                uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))

                subject = "Verify Your Email - MyApp"
                message = (
                    f"Hello {user.full_name or user.username},\n\n"
                    f"An OTP has been sent to verify your account.\n\n"
                    f"Your verification code is: {user.otp}\n\n"
                    f"This code is valid for 10 minutes.\n\n"
                    f"Thank you!"
                )
                send_async_email.delay(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                return Response(
                    {
                        "message": "An account has been already registered with this email, please confirm the email to continue. OTP resent.",
                        "uidb64": uidb64,
                    },
                    status=status.HTTP_200_OK,
                )

        # Normal registration for new email
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.otp = generate_otp()
        user.save()

        logger.info(f"User created successfully: {user.id} - {mask_email(user.email)}")

        uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))

        # Send verification email (only OTP, no link)
        subject = "Verify Your Email - MyApp"
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
            fail_silently=False,
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


class ProfileView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileSerializer

    def get_object(self):
        user_id = self.kwargs["user_id"]
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
        logger.info(f"Password reset request for email: {mask_email(email)}")

        try:
            user = User.objects.get(email=email)
            logger.info(f"User found for password reset: {user.id} - {mask_email(user.email)}")
        except User.DoesNotExist:
            logger.info(f"No user found for email: {mask_email(email)} (silent response)")
            return Response({"message": "If this email exists, a reset link was sent."})

        # Generate secure password reset link (uidb64 + token, no OTP)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        link = f"http://localhost:5173/create-new-password?uidb64={uidb64}&token={token}"

        subject = "Password Reset Request - MyApp"
        message = (
            f"Hello {user.full_name or user.username},\n\n"
            f"You requested a password reset for your account.\n\n"
            f"Click the link below to set a new password:\n\n"
            f"{link}\n\n"
            f"This link is valid for 1 hour.\n\n"
            f"If you didn't request this, please ignore this email."
        )
        send_async_email.delay(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Password reset email queued for user: {mask_email(user.email)}")
        return Response({"message": "If this email is registered, a reset link was sent."})


# PasswordChangeView (Forgot Password Reset - Token-based flow)
class PasswordChangeView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        logger.info("Password change request received")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request content-type: {request.content_type}")
        logger.info("Request contains data payload" if request.data else "No request data provided")
        logger.info("Request data logged in generic form (sensitive fields masked)")

        payload = request.data
        token = payload.get("token")
        uidb64 = payload.get("uidb64")
        password = payload.get("password")

        logger.info(f"Token present: {bool(token)}")
        logger.info(f"uidb64 present: {bool(uidb64)}")
        logger.info("password present. ")

        missing_fields = []
        if not token:
            missing_fields.append("token")
        if not uidb64:
            missing_fields.append("uidb64")
        if not password:
            missing_fields.append("password")

        if missing_fields:
            logger.warning(f"Missing required fields: {missing_fields}")
            logger.warning("Received payload with sensitive fields masked")
            return Response(
                {"error": "Missing required fields", "missing": missing_fields},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            logger.info(f"Decoded user_id from uidb64: {user_id}")
            user = User.objects.get(pk=user_id)
            logger.info(f"User found for password change: {user.id} - {mask_email(user.email)}")
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid uidb64 decoding: {str(e)}", exc_info=True)
            return Response({"error": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            logger.warning(f"User not found for decoded user_id: {user_id}")
            return Response({"error": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            logger.warning(f"Invalid or expired token for user: {user.id}")
            return Response(
                {"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent reusing the same password
        if user.check_password(password):
            logger.warning(f"User {user.id} attempted to reuse the same password during reset")
            return Response(
                {"error": "New password cannot be the same as your current password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Token valid for user: {user.id}. Proceeding to set new password.")
        user.set_password(password)
        user.save()
        logger.info(f"Password successfully changed for user: {user.id} - {mask_email(user.email)}")
        return Response({"message": "Password Changed Successfully"}, status=status.HTTP_200_OK)

class VerifyEmailOTP(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        payload = request.data
        otp = payload.get("otp")
        uidb64 = payload.get("uidb64")

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


# Updated google_login view with blocked vendor check
@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    credential = request.data.get("credential")
    if not credential:
        return Response(
            {"error": "Credential not provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        id_info = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        email = id_info["email"]
        full_name = id_info.get("name", "")
        email_username, _ = email.split("@")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "username": email_username,
                "phone": "",
            },
        )

        if created:
            user.set_unusable_password()
            logger.info(f"New user created via Google signup: ID={user.id}, Email={user.email}")

        user.email_verified = id_info.get("email_verified", False)
        user.save()

        # === BLOCKED VENDOR CHECK ===
        try:
            vendor = user.vendor
            if vendor and not vendor.active:
                logger.warning(f"Blocked vendor attempted Google login: {user.email} (Vendor ID: {vendor.id})")
                return Response(
                    {"error": "Your account is blocked, please contact admin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Vendor.DoesNotExist:
            pass  # Not a vendor → continue
        # ===============================

        token = MyTokenObtainPairSerializer.get_token(user)

        response_data = {
            "access": str(token.access_token),
            "refresh": str(token),
            "user_id": user.id,
            "new_user": created,  # Critical: tells frontend if this was a new signup
        }

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        logger.info(f"Google login successful: User ID={user.id}, New user={created}")

        return Response(response_data, status=status_code)

    except ValueError as e:
        logger.warning(f"Invalid Google credential: {str(e)}")
        return Response({"error": "Invalid credential"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in google_login: {str(e)}", exc_info=True)
        return Response({"error": "Authentication failed"}, status=status.HTTP_400_BAD_REQUEST)


# Address Management ViewSet
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        if instance.status:
            Address.objects.filter(user=self.request.user).exclude(pk=instance.pk).update(
                status=False
            )

    def perform_update(self, serializer):
        instance = serializer.save()
        if "status" in serializer.validated_data and serializer.validated_data["status"]:
            Address.objects.filter(user=self.request.user).exclude(pk=instance.pk).update(
                status=False
            )


# Profile View (show details + addresses)
class UserProfileDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get(self, request, *args, **kwargs):
        profile = request.user.profile
        addresses = Address.objects.filter(user=request.user)

        data = {
            "profile": ProfileSerializer(profile, context={"request": request}).data,
            "addresses": AddressSerializer(
                addresses, many=True, context={"request": request}
            ).data,
        }
        return Response(data)


# Edit Profile
class UserProfileUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile


# Change Password (logged-in user)
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.has_usable_password():
            return Response(
                {"error": "Password change not available for Google login users."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        new_password2 = request.data.get("new_password2")

        if not request.user.check_password(old_password):
            return Response(
                {"error": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != new_password2:
            return Response(
                {"error": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent reusing the same password
        if request.user.check_password(new_password):
            return Response(
                {"error": "New password cannot be the same as your current password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Password changed successfully."})


# Request Email Change
class ChangeEmailRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get("new_email")

        if not new_email:
            return Response(
                {"error": "New email is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        if new_email.lower() == request.user.email.lower():
            return Response(
                {"error": "This is your current email."}, status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email__iexact=new_email).exists():
            return Response(
                {"error": "This email is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.has_usable_password():
            return Response(
                {
                    "error": "Email change not available for Google login users."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = generate_otp()
        request.user.otp = otp
        request.user.pending_email = new_email
        request.user.save()

        subject = "Verify Your New Email Address"
        message = (
            f"Hello {request.user.full_name or 'User'},\n\n"
            f"Your OTP to change email is: {otp}\n\n"
            f"This OTP is valid for 10 minutes."
        )
        send_async_email.delay(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
        )

        return Response({"message": "OTP sent to new email address."})


# Verify Email Change
class VerifyEmailChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp = request.data.get("otp")

        if not request.user.otp or not request.user.pending_email:
            return Response(
                {"error": "No pending email change request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.otp != otp:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        old_email = request.user.email
        request.user.email = request.user.pending_email
        request.user.pending_email = None
        request.user.otp = None
        request.user.email_verified = True

        # Update username from new email
        email_username = request.user.email.split("@")[0]
        base_username = email_username
        counter = 1
        while User.objects.filter(username=base_username).exclude(pk=request.user.pk).exists():
            base_username = f"{email_username}{counter}"
            counter += 1
        request.user.username = base_username

        request.user.save()

        return Response(
            {
                "message": f"Email successfully changed from {old_email} to {request.user.email}."
            }
        )