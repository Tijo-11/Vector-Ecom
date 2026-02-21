from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

# drf-yasg Swagger
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="RetroRelics API",
        default_version='v1',
        description="RetroRelics Multi-vendor E-commerce Backend API",
        terms_of_service="https://www.retrorelics.live",
        contact=openapi.Contact(email="tijo@retrorelics.live"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Routes (adjust only if your app urls differ)
    path('api/', include('store.urls')),
    path('api/auth/', include('userauth.urls')),
    path('api/vendor/', include('vendor.urls')),
    path('api/customer/', include('customer.urls')),
    path('api/addon/', include('addon.urls')),

    # Swagger / Redoc Documentation (already working on your live site)
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# ====================== MEDIA SERVING FOR AZURE (THIS FIXES IMAGES) ======================
# This is the proven method that works with Gunicorn + Azure App Service
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# Static files only in development (WhiteNoise already handles production)
if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)