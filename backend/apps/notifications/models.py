from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

class Notification(BaseModel):
    class Type(models.TextChoices):
        ORDER = 'ORDER', 'Order'
        PAYMENT = 'PAYMENT', 'Payment'
        QR = 'QR', 'QR Code'
        KITCHEN = 'KITCHEN', 'Kitchen'
        COMMUNICATION = 'COMMUNICATION', 'Communication'
        AI = 'AI', 'AI'
        SYSTEM = 'SYSTEM', 'System'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        NORMAL = 'NORMAL', 'Normal'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    
    reference_type = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. PreBooking, MenuItem")
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.type} to {self.recipient.email}"

class NotificationPreference(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    
    order_notifications = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    kitchen_notifications = models.BooleanField(default=True)
    communication_notifications = models.BooleanField(default=True)
    ai_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"Preferences for {self.user.email}"
