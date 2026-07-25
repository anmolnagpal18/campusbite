import os
import django
from django.test import Client
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

client = Client()

print("--- Testing Super Admin Login ---")
login_data = {
    "email": "superadmin@campusfood.com",
    "password": "Admin@123"
}
response = client.post('/api/auth/login/', data=json.dumps(login_data), content_type='application/json')
print("Status Code:", response.status_code)
print("Response Content:", response.content)

print("\n--- Testing User Signup ---")
signup_data = {
    "email": "testuser@campusfood.com",
    "password": "Password@123",
    "confirm_password": "Password@123"
}
response = client.post('/api/auth/signup/user/', data=json.dumps(signup_data), content_type='application/json')
print("Status Code:", response.status_code)
print("Response Content:", response.content)
