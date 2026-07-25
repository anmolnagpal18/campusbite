import os
import django
from django.test import Client
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

client = Client()

print("--- Testing V1 Super Admin Login ---")
login_data = {
    "email": "superadmin@campusfood.com",
    "password": "Admin@123"
}
response = client.post('/api/v1/auth/login/', data=json.dumps(login_data), content_type='application/json')
print("Status Code:", response.status_code)
content = response.json()
print("Response JSON:", content)

print("\n--- Testing V1 User Signup ---")
signup_data = {
    "email": "testuser2@campusfood.com",
    "password": "Password@123",
    "confirm_password": "Password@123"
}
response = client.post('/api/v1/auth/signup/user/', data=json.dumps(signup_data), content_type='application/json')
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
