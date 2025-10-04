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
import shortuuid
import datetime 
import os 
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