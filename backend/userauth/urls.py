from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    MyTokenObtainPairView,
    RegisterView,
    PasswordEmailVerify,
    PasswordChangeView,  # This is the forgot-password flow
    ProfileView,          # Old profile view (kept for backward compatibility if needed)
    VerifyEmailOTP,
    google_login,
    AddressViewSet,
    UserProfileDetailView,
    UserProfileUpdateView,
    ChangePasswordView,   # New logged-in change password
    ChangeEmailRequestView,
    VerifyEmailChangeView,
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
# Prefix with 'user/' to match existing pattern and frontend calls (/api/user/addresses/)
router.register(r'user/addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('user/token/', MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('user/register/', RegisterView.as_view(), name="Register_view"),
    path('user/token/refresh/', TokenRefreshView.as_view(), name='Token Refresh'),
    path('user/password-reset/<email>/', PasswordEmailVerify.as_view(), name='Pasword_Reset'),
    path('user/password-change/', PasswordChangeView.as_view(), name='password_reset'),  # Forgot password flow
    path('user/profile/<user_id>/', ProfileView.as_view(), name="Profile_view"),  # Kept for any legacy frontend calls
    path('user/verify-otp/', VerifyEmailOTP.as_view(), name='verify_otp'),
    path('user/google-login/', google_login, name='google_login'),
    
    # New consistent user-prefixed endpoints
    path('user/profile/', UserProfileDetailView.as_view(), name='user-profile-detail'),  # GET current user's profile + addresses
    path('user/profile/update/', UserProfileUpdateView.as_view(), name='user-profile-update'),  # PATCH profile fields
    path('user/change-password/', ChangePasswordView.as_view(), name='change-password'),  # Logged-in password change
    path('user/change-email/request/', ChangeEmailRequestView.as_view(), name='change-email-request'),
    path('user/change-email/verify/', VerifyEmailChangeView.as_view(), name='change-email-verify'),
]


urlpatterns += router.urls