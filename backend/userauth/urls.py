from django.urls import path
from .views import MyTokenObtainPairView, RegisterView, PasswordEmailVerify, PasswordChangeView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('user/token/', MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('user/register/', RegisterView.as_view(), name= "Register_view"),
    path('user/token/refresh', TokenRefreshView.as_view(), name='Token Refresh' ),
    path('user/password-reset/<email>/', PasswordEmailVerify.as_view(), name='Pasword_Reset' ),
    path('user/password-change/', PasswordChangeView.as_view(), name='password_reset'),
    
]