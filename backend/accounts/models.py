from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from college.models import College

class Role(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    COLLEGE_ADMIN = 'COLLEGE_ADMIN', 'College Admin'
    VENDOR = 'VENDOR', 'Vendor'
    STAFF = 'STAFF', 'Staff'
    USER = 'USER', 'User'

class ApprovalStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role=Role.USER, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, role=Role.SUPER_ADMIN, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    @property
    def approval_status(self):
        if self.role == Role.SUPER_ADMIN:
            return ApprovalStatus.APPROVED
        elif self.role == Role.USER:
            return ApprovalStatus.APPROVED
        elif self.role == Role.COLLEGE_ADMIN:
            return self.college_admin_profile.status if hasattr(self, 'college_admin_profile') else ApprovalStatus.PENDING
        elif self.role == Role.VENDOR:
            return self.vendor_profile.status if hasattr(self, 'vendor_profile') else ApprovalStatus.PENDING
        elif self.role == Role.STAFF:
            return self.staff_profile.status if hasattr(self, 'staff_profile') else ApprovalStatus.PENDING
        return ApprovalStatus.PENDING

    def __str__(self):
        return f"{self.email} ({self.role})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_profile')
    
    def __str__(self):
        return f"User Profile for {self.user.email}"

class CollegeAdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='college_admin_profile')
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='admins')
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)

    def __str__(self):
        return f"College Admin Profile for {self.user.email}"

class VendorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='vendors')
    shop_name = models.CharField(max_length=255)
    shop_area = models.CharField(max_length=255)
    block = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)

    def __str__(self):
        return f"Vendor Profile for {self.shop_name} ({self.user.email})"

class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='staff_members')
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)

    def __str__(self):
        return f"Staff Profile for {self.user.email}"
