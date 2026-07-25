import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from college.models import College
from core.enums import Role, ApprovalStatus
from core.mixins import TimestampedSoftDeletedModel

class UserManager(BaseUserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def all_with_deleted(self):
        return super().get_queryset()

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
    
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)

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

class UserProfile(TimestampedSoftDeletedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_profile')
    
    def __str__(self):
        return f"User Profile for {self.user.email}"

class CollegeAdminProfile(TimestampedSoftDeletedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='college_admin_profile')
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='admins')
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)

    def __str__(self):
        return f"College Admin Profile for {self.user.email}"

class VendorProfile(TimestampedSoftDeletedModel):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='vendors')
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)

    def __str__(self):
        shop_name = getattr(self.restaurant, 'name', 'No Restaurant') if hasattr(self, 'restaurant') else 'No Restaurant'
        return f"Vendor Profile for {shop_name} ({self.user.email})"

class Restaurant(TimestampedSoftDeletedModel):
    vendor = models.OneToOneField(VendorProfile, on_delete=models.CASCADE, related_name='restaurant')
    name = models.CharField(max_length=255)
    shop_area = models.CharField(max_length=255)
    block = models.CharField(max_length=255)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class StaffProfile(TimestampedSoftDeletedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, to_field='uuid', related_name='staff_members')
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)

    def __str__(self):
        return f"Staff Profile for {self.user.email}"

class ApprovalLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approval_logs')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='actioned_approvals')
    role = models.CharField(max_length=50)
    action = models.CharField(max_length=20)
    remarks = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.user.email} by {self.approved_by.email if self.approved_by else 'System'}"
