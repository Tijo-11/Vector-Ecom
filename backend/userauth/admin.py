from django.contrib import admin
from userauth.models import Profile, User


class UserAdmin(admin.ModelAdmin):#Defines a custom admin interface for the User model — lets you control how 
#it appears and behaves in Django Admin. Extend this to customize list display, filters, search, etc.
#admin.ModelAdmin is a Django class that allows you to customize how a model is displayed and managed in the admin
# interface. It provides several powerful options such as list_display to control which fields appear in the
# list view, list_filter to add sidebar filters for quick data segmentation, and search_fields to enable search
# functionality across specified fields. You can also define ordering to set the default sort order, use 
# readonly_fields to make certain fields non-editable, and structure forms with fieldsets. Additionally, 
# it supports inlines for embedding related models and actions for bulk operations like delete or export. 
# You can even override the default form using the form attribute to apply custom validation or layout.
# All these features are optional and can be tailored to fit the specific needs of your model’s admin interface.
    search_fields  = ['full_name', 'username', 'email',  'phone']
#Enables admin search bar to filter users by matching text in these fields — supports partial matches 
# and case-insensitive queries.
    list_display  = ['username', 'email', 'phone']

class ProfileAdmin(admin.ModelAdmin):
    search_fields  = ['user']
    list_display = ['thumbnail', 'user', 'full_name']

# Register your models here.
admin.site.register(User, UserAdmin)
#Registers the User model with Django Admin using the custom UserAdmin class — this tells Django to use your 
# tailored admin interface (with search, filters, etc.) instead of the default one.
admin.site.register(Profile, ProfileAdmin)
