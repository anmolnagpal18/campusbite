import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    # We will use string reference 'accounts.User' or settings.AUTH_USER_MODEL to avoid circular imports.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="%(class)s_created", 
        on_delete=models.SET_NULL, null=True, blank=True
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="%(class)s_updated", 
        on_delete=models.SET_NULL, null=True, blank=True
    )
    version = models.PositiveIntegerField(default=1)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Soft delete implementation"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self):
        """Actual delete from database"""
        super().delete()
