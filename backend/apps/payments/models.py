import uuid
from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
from apps.vendors.models import Vendor
from apps.orders.models import PreBooking

class Payment(BaseModel):
    class PaymentStatus(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REFUNDED = 'REFUNDED', 'Refunded'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='payments')
    pre_booking = models.ForeignKey(PreBooking, on_delete=models.CASCADE, related_name='payments')
    
    payment_reference = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    razorpay_order_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=512, blank=True, null=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.CREATED)
    
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    gateway = models.CharField(max_length=50, default='RAZORPAY')
    gateway_response = models.JSONField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    # Refund tracking for future phases
    refund_status = models.CharField(max_length=50, blank=True, null=True)
    refund_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Payment {self.payment_reference} for {self.pre_booking.booking_reference}"

class PaymentLog(BaseModel):
    """Audit trail for payment state changes and webhooks"""
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='logs')
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.event_type} - {self.payment.payment_reference}"
