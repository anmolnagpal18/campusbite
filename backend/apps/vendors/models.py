from django.db import models
from django.utils.text import slugify
from django.conf import settings
from apps.common.models import BaseModel
from apps.universities.models import Block

class Vendor(BaseModel):
    class VendorStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    vendor_name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    owner_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    description = models.TextField(blank=True, null=True)
    logo = models.URLField(max_length=500, blank=True, null=True)
    
    block = models.ForeignKey(Block, on_delete=models.SET_NULL, null=True, related_name='vendors')
    
    status = models.CharField(
        max_length=20, 
        choices=VendorStatus.choices, 
        default=VendorStatus.PENDING
    )
    
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_vendors'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.vendor_name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vendor_name} ({self.get_status_display()})"
