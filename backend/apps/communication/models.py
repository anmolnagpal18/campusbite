from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
from apps.vendors.models import Vendor
from apps.orders.models import PreBooking

class CommunicationChannel(BaseModel):
    class Platform(models.TextChoices):
        WHATSAPP = 'WHATSAPP', 'WhatsApp'
        TELEGRAM = 'TELEGRAM', 'Telegram'

    class OptInSource(models.TextChoices):
        SETTINGS = 'SETTINGS', 'User Settings'
        CHECKOUT = 'CHECKOUT', 'Checkout Page'
        BOT_DIRECT = 'BOT_DIRECT', 'Direct Bot Interaction'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='communication_channels', null=True, blank=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='communication_channels', null=True, blank=True)
    
    platform = models.CharField(max_length=20, choices=Platform.choices)
    
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="Required for WhatsApp")
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True, help_text="Required for Telegram")
    
    verified = models.BooleanField(default=False)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    
    notifications_enabled = models.BooleanField(default=True)
    preferred_language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    opt_in_source = models.CharField(max_length=20, choices=OptInSource.choices, default=OptInSource.SETTINGS)

    class Meta:
        unique_together = ('student', 'platform')
        # Also could have unique_together for ('vendor', 'platform') but this suffices for base logic

    def __str__(self):
        owner = self.student.email if self.student else (self.vendor.name if self.vendor else "Unknown")
        return f"{self.platform} - {owner}"

class MessageLog(BaseModel):
    class MessageType(models.TextChoices):
        ORDER_CONFIRMED = 'ORDER_CONFIRMED', 'Order Confirmed'
        PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Success'
        PREPARING = 'PREPARING', 'Preparing'
        READY = 'READY', 'Ready for Pickup'
        PICKED_UP = 'PICKED_UP', 'Picked Up'
        CANCELLED = 'CANCELLED', 'Cancelled'
        FAILED = 'FAILED', 'Failed'

    class InternalStatus(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        SENT = 'SENT', 'Sent'
        DELIVERED = 'DELIVERED', 'Delivered'
        FAILED = 'FAILED', 'Failed'
        
    channel = models.ForeignKey(CommunicationChannel, on_delete=models.SET_NULL, null=True, related_name='messages')
    booking = models.ForeignKey(PreBooking, on_delete=models.CASCADE, related_name='messages')
    
    message_type = models.CharField(max_length=20, choices=MessageType.choices)
    message_id = models.CharField(max_length=255, blank=True, null=True, unique=True, help_text="Provider Message ID")
    
    status = models.CharField(max_length=20, choices=InternalStatus.choices, default=InternalStatus.QUEUED)
    provider = models.CharField(max_length=50, help_text="WHATSAPP or TELEGRAM")
    provider_status = models.CharField(max_length=50, blank=True, null=True, help_text="Raw status from provider webhook")
    
    payload = models.JSONField(blank=True, null=True)
    response = models.JSONField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    retry_count = models.IntegerField(default=0)
    
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.message_type} to {self.channel} ({self.status})"
