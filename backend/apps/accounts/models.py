import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from apps.common.models import BaseModel

class Role(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    VENDOR = 'VENDOR', 'Vendor'
    UNIVERSITY_ADMIN = 'UNIVERSITY_ADMIN', 'University Admin'
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.SUPER_ADMIN)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.STUDENT)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email
