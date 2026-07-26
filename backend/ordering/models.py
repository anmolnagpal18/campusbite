import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import Restaurant
from vendor.models import FoodItem
from core.mixins import TimestampedSoftDeletedModel

User = get_user_model()

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart', db_index=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.food_item.item_name} in {self.cart.user.email}'s cart"

class Order(TimestampedSoftDeletedModel):
    class OrderType(models.TextChoices):
        INSTANT = 'INSTANT', 'Instant Order'
        PREORDER = 'PREORDER', 'Pre Order'

    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PREPARING = 'PREPARING', 'Preparing'
        READY = 'READY', 'Ready'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', db_index=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders', db_index=True)
    order_type = models.CharField(max_length=20, choices=OrderType.choices, default=OrderType.INSTANT)
    pickup_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)
    cancel_reason = models.TextField(null=True, blank=True)
    
    total = models.DecimalField(max_digits=10, decimal_places=2)
    instant_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True)
    qr_uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    qr_expired = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['user']),
            models.Index(fields=['restaurant']),
            models.Index(fields=['created_at']),
            models.Index(fields=['qr_uuid']),
        ]

    def __str__(self):
        return f"Order {self.order_number} ({self.status})"

    @classmethod
    def generate_next_order_number(cls):
        current_year = timezone.now().year
        prefix = f"CB-{current_year}-"
        
        last_order = cls.objects.filter(order_number__startswith=prefix).order_by('-id').first()
        if not last_order:
            next_num = 1
        else:
            try:
                # Extract number from format e.g. CB-2026-000001
                last_num_str = last_order.order_number.replace(prefix, "")
                next_num = int(last_num_str) + 1
            except (ValueError, IndexError):
                next_num = 1
        return f"{prefix}{next_num:06d}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.food_item.item_name} for Order {self.order.order_number}"

class Payment(models.Model):
    class PaymentStatus(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        PENDING = 'PENDING', 'Pending'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment', db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.SUCCESS, db_index=True)
    transaction_id = models.CharField(max_length=100, unique=True)
    method = models.CharField(max_length=50, default='MOCK_WALLET')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.transaction_id} for Order {self.order.order_number}"

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        ORDER = 'ORDER', 'Order'
        PAYMENT = 'PAYMENT', 'Payment'
        SYSTEM = 'SYSTEM', 'System'
        MESSAGE = 'MESSAGE', 'Message'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', db_index=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.SYSTEM, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Notification for {self.user.email} - {self.title}"
