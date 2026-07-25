import os
import uuid
from io import BytesIO
from django.db import models
from django.core.files.base import ContentFile
from PIL import Image
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
    food_thumbnail = models.ImageField(upload_to='food/thumbs/', null=True, blank=True)
    availability = models.CharField(max_length=20, choices=ItemAvailability.choices, default=ItemAvailability.AVAILABLE)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'item_name']

    def save(self, *args, **kwargs):
        # Only compress and generate thumbnail if a new file is uploaded
        if self.food_image and hasattr(self.food_image, 'file'):
            # Prepend UUID to the filename
            ext = os.path.splitext(self.food_image.name)[1].lower()
            if not ext:
                ext = '.jpg'
            
            # Create a unique filename prefix
            unique_id = uuid.uuid4().hex[:8]
            base_name = os.path.basename(self.food_image.name)
            name_without_ext = os.path.splitext(base_name)[0]
            # Clean name from special chars
            clean_name = "".join(c for c in name_without_ext if c.isalnum() or c in ('-', '_')).strip()
            
            filename = f"{unique_id}-{clean_name}{ext}"
            thumb_filename = f"{unique_id}-{clean_name}.webp"

            # Open PIL image
            img = Image.open(self.food_image)
            
            # Convert mode to RGB if RGBA/LA (JPEG/WebP doesn't support transparency)
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # 1. Resize primary image to max 800x800 px
            img.thumbnail((800, 800))
            temp_io = BytesIO()
            img.save(temp_io, format='JPEG', quality=85)
            temp_io.seek(0)
            self.food_image.save(filename, ContentFile(temp_io.read()), save=False)

            # 2. Generate a thumbnail (300x300 px) in WebP format
            img.thumbnail((300, 300))
            thumb_io = BytesIO()
            img.save(thumb_io, format='WEBP', quality=85)
            thumb_io.seek(0)
            self.food_thumbnail.save(thumb_filename, ContentFile(thumb_io.read()), save=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item_name} ({self.category.category_name})"
