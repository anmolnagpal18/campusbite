import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from ordering.models import Notification
from accounts.models import User

user = User.objects.get(email='user@campusfood.com')
for n in Notification.objects.filter(user=user).order_by('-id')[:20]:
    msg = n.message.replace('\u20b9', 'Rs. ')
    print(f"ID: {n.id} | Title: {n.title} | Type: {n.notification_type} | Message: {msg[:60]}")
