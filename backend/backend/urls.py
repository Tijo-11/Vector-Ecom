"""
The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/

"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static # Imports helper to serve media and static files during development.
from rest_framework import permissions #imports all permission classes from Django REST Framework’s permissions module
from drf_yasg.views import get_schema_view
#get_schema_view sets up the OpenAPI schema view for Swagger or Redoc UI in Django REST Framework.
#It auto-generates interactive API docs based on your serializers, views, and routes.
#Typically used in urls.py to expose /swagger/ or /redoc/ endpoints.
from drf_yasg import openapi
#This imports the openapi module from drf_yasg, which lets you define metadata for your API docs
#Used to describe your API’s title, version, description, contact, license, etc.
#Passed into get_schema_view() to customize Swagger/Redoc UI.

# Initializes OpenAPI schema view for auto-generated Swagger/Redoc API docs
schema_view = get_schema_view(
    openapi.Info(
      title="RetroRelics Backend APIs",
      default_version='v1',
      description="This is the API documentation for RetroRelics E-commerce project APIs",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="tijot111@gmail.com"),
      license=openapi.License(name="BSD License"),
   ),
    public = True,
    permission_classes=(permissions.AllowAny,),
)


urlpatterns = [
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    # Serves raw OpenAPI schema (JSON/YAML) without Swagger UI at /swagger.json or /swagger.yaml
    #This is useful for tools or services that consume your API schema programmatically—like Postman 
    # or frontend code generators. The <format> part dynamically handles .json or .yaml extensions.
    path('', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # Serves interactive Swagger UI for exploring and testing API at root URL ('/')
    #This gives developers and frontend teams a live, clickable interface to view endpoints, send requests,
    # and see responses—perfect for integrating with React frontend or debugging your Django backend.
    path('admin/', admin.site.urls),
    path('api/', include('userauth.urls')),
    path('api/', include('store.urls')),
    
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

## Appends URL routes that let Django serve media files (like images or videos) from MEDIA_ROOT when accessed 
# via MEDIA_URL — only used in development. static function comes from Django's URL utilities; used to generate URL
# patterns for serving static/media files in development.
urlpatterns += static(settings.STATIC_URL, document_root = settings.STATIC_ROOT)
# Adds URL routes to serve static files (CSS, JS, etc.) from STATIC_ROOT via STATIC_URL — 
# only used in development when DEBUG=True.

# Whenever a user access slash media on the URL and add the name of an image, let's say my profile
# picture.JPG,  we are telling Django is Django.
# You should look for that media file in this folder called media.

