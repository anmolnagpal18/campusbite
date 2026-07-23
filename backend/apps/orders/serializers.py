from rest_framework import serializers
from .models import Cart, CartItem, CartItemAddOn, PickupSlot, PreBooking, BookingItem
from apps.menus.models import MenuItem, MenuVariant, AddOn

class CartItemAddOnSerializer(serializers.ModelSerializer):
    addon_name = serializers.ReadOnlyField(source='addon.name')

    class Meta:
        model = CartItemAddOn
        fields = ['id', 'addon', 'addon_name', 'quantity', 'price']
        read_only_fields = ['price']

class CartItemSerializer(serializers.ModelSerializer):
    addons = CartItemAddOnSerializer(many=True, read_only=True)
    menu_item_name = serializers.ReadOnlyField(source='menu_item.name')
    variant_name = serializers.ReadOnlyField(source='variant.name')

    class Meta:
        model = CartItem
        fields = ['id', 'menu_item', 'menu_item_name', 'variant', 'variant_name', 'quantity', 'unit_price', 'total_price', 'special_instructions', 'addons']
        read_only_fields = ['unit_price', 'total_price']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'vendor', 'subtotal', 'total', 'status', 'items']
        read_only_fields = ['vendor', 'subtotal', 'total', 'status']


class PickupSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickupSlot
        fields = '__all__'


class BookingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingItem
        fields = '__all__'
        read_only_fields = ['booking']

class PreBookingSerializer(serializers.ModelSerializer):
    items = BookingItemSerializer(many=True, read_only=True)
    vendor_name = serializers.ReadOnlyField(source='vendor.vendor_name')
    student_name = serializers.ReadOnlyField(source='student.first_name')

    class Meta:
        model = PreBooking
        fields = '__all__'
        read_only_fields = (
            'booking_reference', 'subtotal', 'total', 'status', 
            'confirmed_at', 'preparing_at', 'ready_at', 'completed_at', 'cancelled_at'
        )
