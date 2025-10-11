# your_project/celery.py
import os
from celery import Celery


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')  # Replace 'your_project' with your actual project name

app = Celery('backend')  


app.config_from_object('django.conf:settings', namespace='CELERY')
