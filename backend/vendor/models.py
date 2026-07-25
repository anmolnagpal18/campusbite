from django.db import models
from accounts.models import Restaurant
from core.enums import CategoryStatus, ItemAvailability
from core.mixins import TimestampedSoftDeletedModel

class FoodCategory(TimestampedSoftDeletedModel):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='categories')
    category_name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=CategoryStatus.choices, default=CategoryStatus.ACTIVE)

    class Meta:
        ordering = ['display_order', 'category_name']
        verbose_name_plural = "Food Categories"

    def __str__(self):
        return f"{self.category_name} ({self.restaurant.restaurant_name})"

class FoodItem(TimestampedSoftDeletedModel):
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.IntegerField(default=0)
    food_image = models.ImageField(upload_to='food/', null=True, blank=True)
    availability = models.CharField(max_length=20, choices=ItemAvailability.choices, default=ItemAvailability.AVAILABLE)

    class Meta:
        ordering = ['item_name']

    def __str__(self):
        return f"{self.item_name} ({self.category.category_name})"
