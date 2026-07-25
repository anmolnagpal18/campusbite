from django.db import models
from core.mixins import TimestampedSoftDeletedModel
from core.enums import ApprovalStatus

class College(TimestampedSoftDeletedModel):
    name = models.CharField(max_length=255, unique=True)
    city = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.APPROVED)

    def __str__(self):
        return self.name
