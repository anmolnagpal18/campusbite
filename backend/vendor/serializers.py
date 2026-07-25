from rest_framework import serializers
from accounts.models import Restaurant
from vendor.models import FoodCategory, FoodItem

class RestaurantSerializer(serializers.ModelSerializer):
    is_currently_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id', 'restaurant_name', 'shop_area', 'block', 
            'opening_time', 'closing_time', 'status', 'accepting_orders', 'is_currently_open'
        ]

    def validate(self, data):
        opening_time = data.get('opening_time')
        closing_time = data.get('closing_time')

        if self.instance:
            if opening_time is None:
                opening_time = self.instance.opening_time
            if closing_time is None:
                closing_time = self.instance.closing_time

        if opening_time and closing_time and closing_time <= opening_time:
            raise serializers.ValidationError({
                "closing_time": "Closing time cannot be before or equal to opening time."
            })
        return data

class FoodCategorySerializer(serializers.ModelSerializer):
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = FoodCategory
        fields = ['id', 'category_name', 'display_order', 'status', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_items(self, obj):
        return obj.items.count()

    def validate_category_name(self, value):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'vendor_profile'):
            return value
        
        restaurant = request.user.vendor_profile.restaurant
        qs = FoodCategory.objects.filter(restaurant=restaurant, category_name__iexact=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        
        if qs.exists():
            raise serializers.ValidationError("A category with this name already exists in your restaurant.")
        return value

class FoodItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = FoodItem
        fields = [
            'id', 'category', 'category_name', 'item_name', 'description', 
            'price', 'quantity', 'food_image', 'food_thumbnail', 'availability', 
            'display_order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'food_thumbnail', 'created_at', 'updated_at']

    def validate_food_image(self, value):
        if value:
            # Limit size to 5MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Image file size cannot exceed 5 MB.")
        return value

    def validate_item_name(self, value):
        category_id = self.initial_data.get('category')
        if not category_id and self.instance:
            category_id = self.instance.category.id

        if category_id:
            qs = FoodItem.objects.filter(category_id=category_id, item_name__iexact=value)
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError("An item with this name already exists in this category.")
        return value

    def validate(self, data):
        price = data.get('price')
        if price is not None and price <= 0:
            raise serializers.ValidationError({"price": "Price must be greater than 0."})
        
        quantity = data.get('quantity')
        if quantity is not None and quantity < 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than or equal to 0."})
        return data
