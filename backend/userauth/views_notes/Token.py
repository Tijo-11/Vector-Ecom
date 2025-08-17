'''🔑 What is TokenObtainPairView?
It’s a built-in view that handles user login by issuing:

Access token (short-lived, used for authentication)

Refresh token (long-lived, used to get new access tokens)

⚙️ How to Use It
In urls.py:

python
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
]
Request Example (POST):

json
{
  "username": "your_username",
  "password": "your_password"
}
Response Example:

json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token"
}
🧩 Key Methods & Attributes
Name	Type	Purpose
serializer_class	Attribute	Uses TokenObtainPairSerializer to validate credentials and generate tokens
post(self, request, *args, **kwargs)	Method	Handles POST requests to authenticate and return tokens
permission_classes	Attribute	Default: AllowAny, but can be overridden for custom access control
authentication_classes	Attribute	Not used here since it's for login (no token needed yet)
🔄 Customization
To customize token payload (e.g., add user info), subclass the serializer:

python
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        return data
Then plug it into a custom view:

python
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer'''

#############################################################################
'''📘 This imports the `openapi` module from `drf_yasg`, which lets you define metadata for your API docs.

🔹 Used to describe your API’s title, version, description, contact, license, etc.  
🔹 Passed into `get_schema_view()` to customize Swagger/Redoc UI.

Example:
```python
openapi.Info(
    title="My API",
    default_version='v1',
    description="API for my Django+React app",
)
```

✅ Makes your API docs informative and professional.'''
##################################################
'''
The **BSD License** is a family of **permissive open-source licenses** originally developed at the University
of California, Berkeley. Here's the essence:

### 🧾 Key Features
- **Minimal restrictions**: You can use, modify, and redistribute the code freely—even in proprietary software.
- **No copyleft**: Unlike GPL, it doesn't require derivative works to be open source.
- **Attribution required**: You must retain the original copyright notice and disclaimers.
- **Variants**:
  - **4-Clause BSD** (original): Includes an advertising clause.
  - **3-Clause BSD** (New BSD): Removes the advertising clause—most commonly used today.
  - **2-Clause BSD**: Even simpler, just attribution and disclaimer.

### ✅ Why It’s Popular
- Great for commercial use.
- Encourages wide adoption of software.
- Compatible with many other licenses.

You can explore more details on [Wikipedia's BSD License page](https://en.wikipedia.org/wiki/BSD_licenses) 
or check out [Snyk’s breakdown of BSD licensing](https://snyk.io/blog/what-is-bsd-license/). 
Let me know if you want a comparison with GPL or MIT licenses.'''