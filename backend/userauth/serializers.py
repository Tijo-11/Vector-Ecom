from userauth.models import User, Profile
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 

from rest_framework import serializers






# Define a custom serializer that inherits from TokenObtainPairSerializer
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
   
    @classmethod
    # Define a custom method to get the token for a user
    def get_token(cls, user):

        token = super().get_token(user)
        token['user_id'] = user.id  # Add this line
        token['full_name'] = user.full_name
       
        token['email'] = user.email
        token['username']= user.username#This line embeds the user's username into the token so it can be 
        #accessed later without querying the database.
        try:# Adds vendor ID to token if available; defaults to 0 if missing
            token['vendor_id'] = user.vendor.id
        except:#This safely tries to include the user's vendor.id in the token. If the user has no vendor
            token['vendor_id'] = 0#(or an error occurs), it sets 'vendor_id' to 0 to avoid breaking the token generation
            
        return token# Return the token with custom claims

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators = [validate_password])

    password2 = serializers.CharField(write_only=True, required =True)
    
    class Meta:
        model = User
        # Define the fields from the model that should be included in the serializer
        fields = ('full_name', 'email', 'phone', 'password', 'password2')
        
    def validate(self, attrs):

        if attrs['password'] != attrs['password2']: 
            raise serializers.ValidationError({
                "password":"Password fields do not match"
            })
            '''Needs to  implement it  in frontend to avoid unnecessary 
            #server load'''
        # Return the validated attributes
        return attrs
    def create(self, validated_data):
        # Define a method to create a new user based on validated data
        user = User.objects.create(full_name = validated_data['full_name'],
                email = validated_data['email'],
                phone = validated_data['phone'])
        email_username, domain = user.email.split('@')
        user.username = email_username
        # Set the user's password based on the validated data
        user.set_password(validated_data['password'])
        user.save()
        return user
    

                    
        
class UserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = "__all__"
        
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Mark as read-only for responses
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True, required=False
    )  # Allow updating user via ID
    class Meta:
        model = Profile
        fields = "__all__"
        
    def to_representation(self, instance):# Overrides default output format of serializer
        response = super().to_representation(instance)## Adds nested 'user' data using UserSerializer
        response['user'] = UserSerializer(instance).data
        return response


        
        
        
        
        
        