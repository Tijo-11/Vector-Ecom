from userauth.models import User, Profile
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
#Imports the serializer that handles JWT token generation — it returns both access and refresh tokens when a 
# user logs in. You can override it to include custom user data in the token response.
from rest_framework import serializers
#The line from rest_framework import serializers imports Django REST Framework’s powerful serializers module, 
# which is used to convert complex data types like Django models into native Python datatypes that can then be
# easily rendered into JSON, XML, or other content types — and vice versa. It enables developers to use tools
# like ModelSerializer, which automatically generates fields from a Django model, or Serializer, which allows
# manual definition of fields and validation logic. This module also supports custom validation through methods
# like validate_<fieldname> or by overriding validate() for more complex logic, and it facilitates nested 
# serialization to represent relationships between models such as ForeignKey or ManyToMany. For example, 
# a simple UserSerializer using ModelSerializer might look like this: class UserSerializer
# (serializers.ModelSerializer): class Meta: model = User; fields = ['id', 'username', 'email']. 
# This makes it easier to build APIs that are clean, efficient, and maintainable.
from rest_framework.validators import UniqueValidator 
#Ensures a field value is unique across the database — commonly used with email or username fields to 
# prevent duplicates during registration.


'''
Should we go with JWT authentication or other authentication like Django allauth?'''

# Define a custom serializer that inherits from TokenObtainPairSerializer
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    '''
    class MyTokenObtainPairSerializer(TokenObtainPairSerializer):: This line creates a new token serializer 
    called MyTokenObtainPairSerializer that is based on an existing one called TokenObtainPairSerializer. 
    Think of it as customizing the way tokens work.
    @classmethod: This line indicates that the following function is a class method, which means it belongs to 
    the class itself and not to an instance (object) of the class.
    def get_token(cls, user):: This is a function (or method) that gets called when we want to create a token 
    for a user. The user is the person who's trying to access something on the website.
    token = super().get_token(user): Here, it's asking for a regular token from the original token serializer 
    (the one it's based on). This regular token is like a key to enter the website.
    token['full_name'] = user.full_name, token['email'] = user.email, token['username'] = user.username: 
    This code is customizing the token by adding extra information to it. For example, it's putting the user's 
    full name, email, and username into the token. These are like special notes attached to the key.
    return token: Finally, the customized token is given back to the user. Now, when this token is used, 
    it not only lets the user in but also carries their full name, email, and username as extra information, 
    which the website can use as needed.
    '''
    @classmethod
    # Define a custom method to get the token for a user
    def get_token(cls, user):
#Defines a class method to generate a token (usually JWT) for a given user — often used to customize token 
# payload or include extra user info like name or role. cls refers to the class itself, allowing access to 
# class-level methods or attributes (like TokenObtainPairSerializer)
        token = super().get_token(user)
        # Call the parent class's get_token method, user: A Django User instance (or custom user model).
        #Returns A RefreshToken object containing both tokens.
#get_token(user) returns a RefreshToken object, which behaves like a dictionary but is actually a 
# subclass of Token. token['username'] = user.username  # ✅ works like a dict
        token['full_name'] = user.full_name
        # Adds user's full name to JWT payload as 'full_name' claim
        # Claim = key-value pair in JWT payload (e.g., "username": "john")
        #Claims help APIs identify the user and apply permissions without querying the database.
        token['email'] = user.email
        token['username']= user.username#This line embeds the user's username into the token so it can be 
        #accessed later without querying the database.
        try:#🧾 Adds vendor ID to token if available; defaults to 0 if missing
            token['vendor_id'] = user.vendor.id
        except:#This safely tries to include the user's vendor.id in the token. If the user has no vendor
            token['vendor_id'] = 0#(or an error occurs), it sets 'vendor_id' to 0 to avoid breaking the token generation
            
        return token# Return the token with custom claims

class RegisterSerializer(serializers.ModelSerializer):# Define a serializer for user registration, which 
    #inherits from serializers.ModelSerializer
    # Define fields for the serializer, including password and password2
    password = serializers.CharField(write_only=True, required=True, validators = [validate_password])
# Defines a password field for the serializer, 'CharField' specifies that the input should be a string,
#'write_only=True' ensures the password is not included in serialized output (e.g., API responses)
# 'required=True' makes the field mandatory during data submission
# 'validators=[validate_password]' applies Django's built-in password validation rules
#    - This checks for strength, length, common passwords, numeric-only passwords, etc.
    password2 = serializers.CharField(write_only=True, required =True)
    
    class Meta:
        model = User
        # Define the fields from the model that should be included in the serializer
        fields = ('full_name', 'email', 'phone', 'password', 'password2')
        
    def validate(self, attrs):
#In Django REST Framework (DRF) serializers, the validate(self, attrs) method receives a dictionary of field
# values that have already passed individual field-level validation.
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
    
# We don't pass 'password' directly into User.objects.create() because:
# Django's default User model stores passwords in a hashed format for security.
# Using user.set_password(validated_data['password']) ensures the password is properly hashed.
# If we passed 'password' directly into User.objects.create(), it would be saved as plain text — 
# a major security risk.
# set_password() uses Django's password hashing system (PBKDF2 by default) to protect user credentials.
                    
        
class UserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fiels = "__all__"
        
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Profile
        fields = "__all__"
        
    def to_representation(self, instance):# Overrides default output format of serializer
        response = super().to_representation(instance)## Adds nested 'user' data using UserSerializer
        response['user'] = UserSerializer(instance.user).data
        return response
#to_representation, which is part of a serializer in Django REST Framework. This method controls how your data is
# converted into JSON when it's sent to the client. super().to_representation(instance): This calls the default
# serializer behavior, turning your model instance into a dictionary of fields.
#response['user'] = UserSerializer(instance.user).data: This adds a nested user object to the response. Instead 
# of just showing the user's ID, it includes full user details using another serializer called UserSerializer.
#return response: Sends back the final dictionary, now with extra user info included.
#Purpose: Convert Profile and related User objects into a dictionary (JSON-compatible).
#self: ProfileSerializer instance.,instance: Object being serialized (e.g., Profile).
#Calls parent’s to_representation for a basic dictionary.
#Adds user data via UserSerializer., Result: Serialized Profile data includes nested user details in JSON.
'''Let’s say you’re serializing a Post model that has a foreign key to a User. Normally, you'd just get the user’s ID. But with this method, you get something like:

json
{
  "id": 1,
  "title": "My Post",
  "user": {
    "id": 5,
    "username": "johndoe",
    "email": "john@example.com"
  }
}'''


        
        
        
        
        
        