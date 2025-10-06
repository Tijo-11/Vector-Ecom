from django.contrib import admin
from userauth.models import Profile, User


class UserAdmin(admin.ModelAdmin):
    search_fields  = ['full_name', 'username', 'email',  'phone', ]
#Enables admin search bar to filter users by matching text in these fields — supports partial matches 
# and case-insensitive queries.
    list_display  = ['username', 'email', 'phone','email_verified']
    list_editable = ['email_verified']

class ProfileAdmin(admin.ModelAdmin):
    search_fields  = ['user']
    list_display = ['thumbnail', 'user', 'full_name']

# Register your models here.
admin.site.register(User, UserAdmin)

admin.site.register(Profile, ProfileAdmin)
