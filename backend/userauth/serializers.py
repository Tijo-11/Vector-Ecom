from userauth.models import User, Profile
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
import logging

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
        if not user.email_verified:
            logger.warning(f"Email not verified for: {email}")
            raise serializers.ValidationError({
                'detail': 'Email not verified. Please check your email for OTP.'
            })
        
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
        # Remove password2 as it's not needed
        validated_data.pop('password2', None)
        
        # Extract username from email
        email = validated_data['email']
        email_username = email.split('@')[0]
        
        # Ensure username is unique
        username = email_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{email_username}{counter}"
            counter += 1
        
        # Create user
        user = User.objects.create(
            full_name=validated_data['full_name'],
            email=email,
            phone=validated_data.get('phone', ''),
            username=username,
            email_verified=False  # Require verification
        )
        user.set_password(validated_data['password'])
        user.save()
        
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='user', 
        write_only=True, 
        required=False
    )

    class Meta:
        model = Profile
        fields = "__all__"

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response['user'] = UserSerializer(instance.user).data
        return response