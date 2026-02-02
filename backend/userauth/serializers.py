from userauth.models import User, Profile
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
import logging
from vendor.models import Vendor  # <-- NEW IMPORT

logger = logging.getLogger(__name__)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer that accepts email instead of username for login
    """
    
    username_field = User.USERNAME_FIELD if hasattr(User, 'USERNAME_FIELD') else 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Replace username field with email field
        self.fields[self.username_field] = serializers.EmailField()
        # Remove username field if it exists and we're using email
        if self.username_field == 'email' and 'username' in self.fields:
            del self.fields['username']
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = user.id
        token['full_name'] = user.full_name
        token['email'] = user.email
        token['username'] = user.username
        try:
            token['vendor_id'] = user.vendor.id
        except:  # noqa
            token['vendor_id'] = 0
        
        # === THIS IS THE MOST IMPORTANT PART ===
        # Without these two lines, the frontend cannot detect admin
        token['is_admin'] = user.is_superuser
        token['is_staff'] = user.is_staff
        # =======================================
        
        return token

    def validate(self, attrs):
        # Get email and password from the request
        email = attrs.get('email', attrs.get(self.username_field))
        password = attrs.get('password')
        
        logger.info(f"Login attempt for email: {email}")
        
        # Try to find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"User not found: {email}")
            raise serializers.ValidationError({
                'detail': 'No active account found with the given credentials'
            })
        
        # === Allow superusers to login even if email not verified ===
        if not user.email_verified and not user.is_superuser:
            logger.warning(f"Email not verified for: {email}")
            raise serializers.ValidationError({
                'detail': 'Email not verified. Please check your email for OTP.'
            })
        # =============================================================
        
        # Authenticate using the correct identifier (email, since USERNAME_FIELD='email')
        authenticated_user = authenticate(
            request=self.context.get('request'),
            username=email,  # Pass email here, not user.username
            password=password
        )
        
        if not authenticated_user:
            logger.warning(f"Authentication failed for: {email}")
            raise serializers.ValidationError({
                'detail': 'No active account found with the given credentials'
            })

        # === BLOCKED VENDOR CHECK ===
        try:
            vendor = authenticated_user.vendor
            if vendor and not vendor.active:
                logger.warning(f"Blocked vendor attempted login: {authenticated_user.email} (Vendor ID: {vendor.id})")
                raise serializers.ValidationError({
                    'detail': 'Your account is blocked, please contact admin.'
                })
        except Vendor.DoesNotExist:
            pass  # Not a vendor → allow login
        # ============================

        refresh = self.get_token(authenticated_user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        logger.info(f"Login successful for: {email}")
        
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'phone', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields do not match"})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        email = validated_data['email']
        email_username = email.split('@')[0]
        username = email_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{email_username}{counter}"
            counter += 1
        
        user = User.objects.create(
            full_name=validated_data['full_name'],
            email=email,
            phone=validated_data.get('phone', ''),
            username=username,
            email_verified=False
        )
        user.set_password(validated_data['password'])
        user.save()
        
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", required=False)
    email = serializers.EmailField(source="user.email", read_only=True)
    about = serializers.CharField(allow_blank=True, required=False)
    address = serializers.CharField(allow_blank=True, required=False)
    city = serializers.CharField(allow_blank=True, required=False)
    state = serializers.CharField(allow_blank=True, required=False)
    country = serializers.CharField(allow_blank=True, required=False)
    postal_code = serializers.CharField(allow_blank=True, required=False)
    image = serializers.ImageField(allow_null=True, required=False, use_url=True)

    can_change_password = serializers.SerializerMethodField()
    can_change_email = serializers.SerializerMethodField()
    user_details = UserSerializer(source="user", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id", "full_name", "email", "about", "address", "city", "state",
            "country", "postal_code", "image", "can_change_password",
            "can_change_email", "user_details",
        ]
        extra_kwargs = {"image": {"required": False, "allow_null": True}}

    def get_can_change_password(self, obj):
        return obj.user.has_usable_password()

    def get_can_change_email(self, obj):
        return obj.user.has_usable_password()

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if "full_name" in user_data:
            instance.user.full_name = user_data["full_name"]
            instance.user.save()
        return super().update(instance, validated_data)