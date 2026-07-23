from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
from apps.vendors.models import Vendor
from apps.menus.models import MenuItem, MenuVariant, AddOn

class Cart(BaseModel):
    class CartStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        CONVERTED = 'CONVERTED', 'Converted'
        ABANDONED = 'ABANDONED', 'Abandoned'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carts')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='carts', null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=CartStatus.choices, default=CartStatus.ACTIVE)

    def __str__(self):
        return f"Cart {self.id} for {self.student.email}"

class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    variant = models.ForeignKey(MenuVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    special_instructions = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"

class CartItemAddOn(BaseModel):
    cart_item = models.ForeignKey(CartItem, on_delete=models.CASCADE, related_name='addons')
    addon = models.ForeignKey(AddOn, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class PickupSlot(BaseModel):
    class SlotStatus(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        FULL = 'FULL', 'Full'
        CLOSED = 'CLOSED', 'Closed'

    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='pickup_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.PositiveIntegerField(default=10)
    current_bookings = models.PositiveIntegerField(default=0)
    slot_status = models.CharField(max_length=20, choices=SlotStatus.choices, default=SlotStatus.OPEN)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ('vendor', 'date', 'start_time', 'end_time')

    def __str__(self):
        return f"{self.date} {self.start_time}-{self.end_time} ({self.vendor.vendor_name})"

class PreBooking(BaseModel):
    class BookingStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PREPARING = 'PREPARING', 'Preparing'
        READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready For Pickup'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        EXPIRED = 'EXPIRED', 'Expired'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='bookings')
    cart = models.OneToOneField(Cart, on_delete=models.SET_NULL, null=True, related_name='booking')
    pickup_slot = models.ForeignKey(PickupSlot, on_delete=models.RESTRICT, related_name='bookings')
    pickup_date = models.DateField()
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    booking_reference = models.CharField(max_length=50, unique=True)

    notes = models.TextField(blank=True, null=True)

    # Lifecycle Timestamps
    confirmed_at = models.DateTimeField(null=True, blank=True)
    preparing_at = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.booking_reference

class BookingItem(BaseModel):
    """Immutable snapshot of the ordered items."""
    booking = models.ForeignKey(PreBooking, on_delete=models.CASCADE, related_name='items')
    menu_item_name = models.CharField(max_length=255)
    variant_name = models.CharField(max_length=150, blank=True, null=True)
    addons_snapshot = models.JSONField(default=list)  # e.g., [{"name": "Extra Cheese", "qty": 1, "price": "20.00"}]
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    special_instructions = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item_name} for {self.booking.booking_reference}"
