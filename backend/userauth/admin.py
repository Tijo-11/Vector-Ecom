from django.contrib import admin
from userauth.models import Profile, User

# Register your models here.
admin.site.register(User)
admin.site.register(Profile)
