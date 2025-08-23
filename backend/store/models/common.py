from django.db import models # Create your models here. from shortuuid.django_fields import ShortUUIDField 
#Imports a Django model field that generates short, unique IDs using the shortuuid library. 
#Useful for replacing default UUIDs with shorter, URL-friendly identifiers in Django models. 
from django.utils.html import mark_safe #Marks a string as safe for HTML rendering in templates. 
#Prevents Django from auto-escaping HTML tags, allowing raw HTML to be rendered. Use cautiously to avoid XSS risks.
from django.utils import timezone#Provides timezone-aware date and time utilities. #Used to get the current time 
#(timezone.now()) that respects Django’s configured timezone settings. 
from django.template.defaultfilters import escape#Escapes HTML special characters in a string #Converts <, >, &,
#etc. into safe entities (&lt;, &gt;, &amp;) to prevent HTML injection in templates. 
from django.urls import reverse #Generates the URL path for a given view name. 
#Used to dynamically build URLs in views or templates, avoiding hardcoding and ensuring maintainability. 
# #Instead of hardcoding a URL like "/products/42/", you can do:reverse("product-detail", args=[42]) 
# #This will return the correct URL for the view named "product-detail" with ID 42, based on your urls.py setup. 
# #Why it's useful: If you ever change your URL patterns, reverse() keeps your code working without manual updates.
from django.shortcuts import redirect #Redirects the user to a different URL or view. 
#Commonly used in views after form submission or login to send users to another page(e.g., redirect('home')). 
from django.dispatch import receiver #Decorator that connects a function to a Django signal. 
#Used to trigger custom logic when specific events occur (e.g., model save/delete), like: 
# #@receiver(post_save, sender=MyModel) # def do_something(sender, instance, **kwargs): This runs do_something 
# after MyModel is saved. 
from django.utils.text import slugify#Converts a string into a URL-friendly “slug”. 
# #Replaces spaces and special characters with hyphens, and lowercases the text # — useful for clean URLs like 
# "My Blog Post" → "my-blog-post". 
from django.core.validators import MinValueValidator, MaxValueValidator #Adds validation constraints to numeric fields in Django models. #Ensures values stay within a defined range — e.g., MinValueValidator(1) prevents values below 1, and # MaxValueValidator(100) blocks values above 100. 
from django.db.models.signals import post_save#Signal triggered after a model instance is saved. #Used to run custom logic (e.g., sending emails, updating related models) right after save() is called on a # model. Commonly paired with @receiver. 
from userauth.models import User, user_directory_path, Profile 
from vendor.models import Vendor 
import shortuuid#Imports the shortuuid library to generate short, unique, URL-safe IDs. 
#It's a compact alternative to Python’s built-in uuid, often used for cleaner database keys or public-facing identifiers. 
import datetime #Imports Python’s built-in datetime module for working with dates and times. 
#Used to create, manipulate, and format date/time objects — e.g., datetime.datetime.now() gives the current timestamp. 
import os #Imports Python’s os module for interacting with the operating system. 
#Used for tasks like reading environment variables, handling file paths, or accessing the file system — e.g., 
# os.path.join() or os.getenv().
from shortuuid.django_fields import ShortUUIDField







''''
You're on the right track with centralizing your imports in `models/__init__.py`. To avoid repeating imports like `import uuid`, `datetime`, or Django utilities in every model file, you can create a **shared module** that acts as a common import hub — and then import from that module wherever needed.

---

### ✅ Step-by-Step: Centralize Common Imports

#### 1. **Create a new file**: `models/common.py`

```python
# models/common.py

import uuid
import datetime
import os
import shortuuid

from django.db import models
from django.utils.html import mark_safe
from django.utils import timezone
from django.template.defaultfilters import escape
from django.urls import reverse
from django.shortcuts import redirect
from django.dispatch import receiver
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save

from userauth.models import User, user_directory_path, Profile
from vendor.models import Vendor
```

---

#### 2. **Use it in your model files** (e.g., `product.py`, `order.py`)

Instead of importing everything individually, just do:

```python
from .common import models, uuid, timezone, reverse, Vendor, User
```

You can selectively import only what you need from `common.py`, keeping each model file clean and consistent.

---

### 🧠 Why This Works Well

- **DRY principle**: Avoids repetition across files
- **Centralized control**: Update imports in one place
- **Cleaner model files**: Easier to read and maintain

---

### ⚠️ Bonus Tip

If you want to go even further, you can define reusable **base classes**, **mixins**, or **custom fields** in `common.py` too — especially if multiple models share logic like slug generation, timestamps, or user ownership.

Let me know if you want help setting up a base model or mixins next.'''