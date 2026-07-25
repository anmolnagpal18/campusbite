from django.db import models

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

class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PREPARING = 'PREPARING', 'Preparing'
    READY = 'READY', 'Ready'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'

class NotificationType(models.TextChoices):
    ORDER_UPDATE = 'ORDER_UPDATE', 'Order Update'
    APPROVAL_STATUS = 'APPROVAL_STATUS', 'Approval Status'
    SYSTEM_ALERT = 'SYSTEM_ALERT', 'System Alert'
