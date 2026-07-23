import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
if not User.objects.filter(email='admin@campusbite.com').exists():
    User.objects.create_superuser(
        email='admin@campusbite.com',
        password='adminpassword',
        first_name='Super',
        last_name='Admin',
        role='SUPER_ADMIN'
    )
    print("Superuser created successfully.")
else:
    print("Superuser already exists.")
