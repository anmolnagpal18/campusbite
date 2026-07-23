from django.db import models
from django.utils.text import slugify
from apps.common.models import BaseModel
from apps.vendors.models import Vendor

class Category(BaseModel):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, blank=True)
    description = models.TextField(blank=True, null=True)
    image = models.URLField(max_length=500, blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('vendor', 'name')
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.vendor.vendor_name}"


class AddOn(BaseModel):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='addons')
    name = models.CharField(max_length=150)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    minimum_quantity = models.PositiveIntegerField(default=0)
    maximum_quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (+₹{self.price})"


class MenuItem(BaseModel):
    class SpiceLevel(models.IntegerChoices):
        MILD = 1, 'Mild'
        MEDIUM = 2, 'Medium'
        HOT = 3, 'Hot'
        EXTRA_HOT = 4, 'Extra Hot'

    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='menu_items')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='menu_items')
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    description = models.TextField(blank=True, null=True)
    image = models.URLField(max_length=500, blank=True, null=True)
    gallery_placeholder = models.JSONField(blank=True, null=True, help_text="Future placeholder for menu galleries")
    
    price = models.DecimalField(max_digits=10, decimal_places=2)
    preparation_time = models.PositiveIntegerField(help_text="Time in minutes")
    calories = models.PositiveIntegerField(blank=True, null=True)
    ingredients = models.TextField(blank=True, null=True)
    
    # Dietary Flags
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_jain = models.BooleanField(default=False)
    contains_egg = models.BooleanField(default=False)
    contains_nuts = models.BooleanField(default=False)
    is_spicy = models.BooleanField(default=False)
    spice_level = models.IntegerField(choices=SpiceLevel.choices, null=True, blank=True)
    
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    
    # Scheduling logic
    available_from = models.TimeField(blank=True, null=True)
    available_until = models.TimeField(blank=True, null=True)

    addons = models.ManyToManyField(AddOn, blank=True, related_name='menu_items')

    class Meta:
        unique_together = ('vendor', 'name')
        ordering = ['category', 'display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MenuVariant(BaseModel):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=150)
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Added to base item price")
    is_default = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.name} for {self.menu_item.name}"
