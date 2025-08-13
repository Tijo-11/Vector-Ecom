"""
The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/

"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static # Imports helper to serve media and static files during development.

urlpatterns = [
    path('admin/', admin.site.urls),
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

