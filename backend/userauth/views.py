#Django
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
#Restframework
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response

#Serializers and Models
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, ProfileSerializer, UserSerializer
from .models import User
#others
import random
import shortuuid
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    

@api_view(['GET'])

def getRoutes(request):
     # It defines a list of API routes that can be accessed.
     routes=[
         '/api/token/', '/api/register/', '/api/token/refresh/', 'api/test'
     ]
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
            raise User.DoesNotExist  # 404 instead of 500
        user = User.objects.get(id=user_id_int)
        return user
    
    
    
    def generate_numeric_otp(length=7):
        # Generate a random 7-digit OTP
        otp=''.join([str(random.randint(0,9)) for _ in range (length)])
        return otp




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
        



        
    
    
    









