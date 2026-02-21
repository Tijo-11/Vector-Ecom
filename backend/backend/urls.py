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
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    
    path('api/', include('store.urls')),
    path('api/auth/', include('userauth.urls')),
    path('api/vendor/', include('vendor.urls')),
    path('api/customer/', include('customer.urls')),
   

    # Swagger / Redoc 
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# ====================== MEDIA SERVING======================

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# Static files (WhiteNoise already handles this in production)
if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)