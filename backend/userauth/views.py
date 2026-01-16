# userauth/views.py (Updated with referral integration)
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
from django.conf import settings
from django.utils import timezone
import logging
from .tasks import send_async_email


from store.models import Address
from store.serializers import AddressSerializer
from rest_framework import viewsets
from rest_framework.views import APIView


logger = logging.getLogger(__name__)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        logger.info("Token request received")
        logger.info(f"Request data keys: {list(request.data.keys())}")
        logger.info(f"Has email: {'email' in request.data}")
        logger.info(f"Has password: {'password' in request.data}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Request method: {request.method}")
       
        try:
            response = super().post(request, *args, **kwargs)
            logger.info("Token generation successful")
            return response
        except Exception as e:
            logger.error(f"Token generation failed: {str(e)}", exc_info=True)
            return Response({
                'error': str(e),
                'detail': 'Token generation failed',
                'received_fields': list(request.data.keys())
            }, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # ============================================
        # EXTRACT REFERRAL TOKEN
        # ============================================
        ref_token = request.data.get('ref_token')
        if ref_token:
            logger.info(f"Referral token received: {ref_token}")
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
       
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            if user.email_verified:
                return Response({
                    "error": "An account with this email already exists, please login."
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Resend OTP for unverified account
                user.otp = generate_otp()
                user.save()
                uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
                
                subject = 'Verify Your Email - MyApp'
                message = (
                    f"Hello {user.full_name or user.username},\n\n"
                    f"Your verification code is: {user.otp}\n\n"
                    f"Alternatively, you can verify your email by visiting the following link:\n"
                    f"http://localhost:5173/verify-email?otp={user.otp}&uidb64={uidb64}\n\n"
                    f"Thank you!"
                )
                send_async_email.delay(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                return Response({
                    "message": "An account has been already registered with this email, please confirm the email to continue. OTP resent.",
                    "uidb64": uidb64
                }, status=status.HTTP_200_OK)
       
        # Normal registration for new email
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.otp = generate_otp()
        user.save()
        
        logger.info(f"User created successfully: {user.id} - {user.email}")
        
        uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
        
        # ============================================
        # APPLY REFERRAL IF TOKEN EXISTS
        # ============================================
        if ref_token:
            logger.info(f"Attempting to apply referral token {ref_token} for user {user.id}")
            
            try:
                from store.models.offer import ReferralOffer
                from store.models import Coupon
                
                # Find the referral offer
                offer = ReferralOffer.objects.get(token=ref_token, is_used=False)
                logger.info(f"Valid referral found: ID={offer.id}, referrer={offer.referring_user.email}")
                
                # Check if expired
                if offer.expiry_date and offer.expiry_date < timezone.now():
                    logger.warning(f"Referral token {ref_token} has expired")
                else:
                    # Generate coupon code
                    coupon_code = shortuuid.uuid()[:8].upper()
                    coupon = Coupon.objects.create(
                        vendor=None,  # Platform-level coupon
                        code=coupon_code,
                        discount=10,  # 10% discount
                        active=True
                    )
                    logger.info(f"Coupon created: {coupon_code} for referrer {offer.referring_user.email}")
                    
                    # Update referral offer
                    offer.reward_coupon = coupon
                    offer.is_used = True
                    offer.save()
                    logger.info(f"Referral marked as used: {offer.token}")
                    
                    # Send reward email to referrer
                    subject = "Referral Reward - New User Signed Up!"
                    message = (
                        f"Hello {offer.referring_user.full_name or offer.referring_user.username},\n\n"
                        f"Great news! A new user ({user.email}) has successfully signed up using your referral link.\n\n"
                        f"As a thank you, here's your exclusive coupon:\n"
                        f"Code: {coupon_code}\n"
                        f"Discount: {coupon.discount}%\n\n"
                        f"Use it on your next purchase!\n\n"
                        f"Thank you for spreading the word!\n"
                        f"— The Team"
                    )
                    
                    send_async_email.delay(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[offer.referring_user.email],
                        fail_silently=False,
                    )
                    logger.info(f"Reward email queued for {offer.referring_user.email}")
                    
            except ReferralOffer.DoesNotExist:
                logger.warning(f"Invalid or already used referral token: {ref_token}")
            except Exception as e:
                logger.error(f"Error applying referral: {str(e)}", exc_info=True)
                # Don't fail registration if referral fails
        
        # Send verification email to new user
        subject = 'Verify Your Email - MyApp'
        message = (
            f"Hello {user.full_name or user.username},\n\n"
            f"Your verification code is: {user.otp}\n\n"
            f"Alternatively, you can verify your email by visiting the following link:\n"
            f"http://localhost:5173/verify-email?otp={user.otp}&uidb64={uidb64}\n\n"
            f"Thank you for registering!"
        )
        send_async_email.delay(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return Response({
            "message": "User registered. OTP sent to email for verification.",
            "uidb64": uidb64,
            "user_id": user.id
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
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "If this email exists, a reset link was sent."})
       
        user.otp = generate_otp()
        user.save()
        uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
        otp = user.otp
        link = f"http://localhost:5173/create-new-password?otp={otp}&uidb64={uidb64}"
        
        subject = "Password Reset Request"
        message = (
            f"Hello {user.full_name or user.username},\n\n"
            f"You requested a password reset for your account.\n\n"
            f"Your OTP code is: {otp}\n\n"
            f"Or reset your password using this link:\n{link}\n\n"
            f"If you didn't request this, please ignore this email."
        )
        send_async_email.delay(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
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
        id_info = google_id_token.verify_oauth2_token(
            credential, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        email = id_info['email']
        full_name = id_info.get('name', '')
        email_username, _ = email.split('@')
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'username': email_username,
                'phone': '',
            }
        )
        
        if created:
            user.set_unusable_password()
        
        user.email_verified = id_info.get('email_verified', False)
        user.save()
        
        token = MyTokenObtainPairSerializer.get_token(user)
        return Response({
            "access": str(token.access_token),
            "refresh": str(token)
        }, status=status.HTTP_200_OK)
    except ValueError as e:#noqa
        return Response({"error": "Invalid credential"}, status=status.HTTP_400_BAD_REQUEST)
    
    
    
    
    
    
    
    


# Address Management ViewSet
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        if instance.status:
            Address.objects.filter(user=self.request.user).exclude(pk=instance.pk).update(status=False)

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'status' in serializer.validated_data and serializer.validated_data['status']:
            Address.objects.filter(user=self.request.user).exclude(pk=instance.pk).update(status=False)

# Profile View (show details + addresses)
class UserProfileDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get(self, request, *args, **kwargs):
        profile = request.user.profile
        addresses = Address.objects.filter(user=request.user)
        
        data = {
            'profile': ProfileSerializer(profile, context={'request': request}).data,
            'addresses': AddressSerializer(addresses, many=True, context={'request': request}).data,
        }
        return Response(data)

# Edit Profile (existing fields only, email/password handled separately)
class UserProfileUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile

# Change Password (only for email/password users)
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.has_usable_password():
            return Response({"error": "Password change not available for Google login users."}, 
                          status=status.HTTP_400_BAD_REQUEST)

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        new_password2 = request.data.get("new_password2")

        if not request.user.check_password(old_password):
            return Response({"error": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != new_password2:
            return Response({"error": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Password changed successfully."})

# Request Email Change (send OTP to new email)
class ChangeEmailRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get("new_email")

        if not new_email:
            return Response({"error": "New email is required."}, status=status.HTTP_400_BAD_REQUEST)

        if new_email.lower() == request.user.email.lower():
            return Response({"error": "This is your current email."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=new_email).exists():
            return Response({"error": "This email is already registered."}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.has_usable_password():
            return Response({"error": "Email change not available for Google login users."}, 
                          status=status.HTTP_400_BAD_REQUEST)

        otp = generate_otp()
        request.user.otp = otp
        request.user.pending_email = new_email
        request.user.save()

        subject = "Verify Your New Email Address"
        message = f"Hello {request.user.full_name or 'User'},\n\nYour OTP to change email is: {otp}\n\nThis OTP is valid for 10 minutes."
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
            return Response({"error": "No pending email change request."}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.otp != otp:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        old_email = request.user.email
        request.user.email = request.user.pending_email
        request.user.pending_email = None
        request.user.otp = None
        request.user.email_verified = True
        
        # Update username from new email
        email_username = request.user.email.split('@')[0]
        base_username = email_username
        counter = 1
        while User.objects.filter(username=base_username).exclude(pk=request.user.pk).exists():
            base_username = f"{email_username}{counter}"
            counter += 1
        request.user.username = base_username
        
        request.user.save()

        return Response({"message": f"Email successfully changed from {old_email} to {request.user.email}."})