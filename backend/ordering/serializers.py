from rest_framework import serializers
from vendor.serializers import FoodItemSerializer, RestaurantSerializer
from ordering.models import Cart, CartItem, Order, OrderItem, Payment, Notification

class CartItemSerializer(serializers.ModelSerializer):
    food_item_details = FoodItemSerializer(source='food_item', read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'food_item', 'food_item_details', 'quantity', 'price', 'subtotal']
        read_only_fields = ['id', 'price']

    def get_subtotal(self, obj):
        return obj.price * obj.quantity

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    restaurant_details = RestaurantSerializer(source='restaurant', read_only=True)
    items_total = serializers.SerializerMethodField()
    gst = serializers.SerializerMethodField()
    instant_charge = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'restaurant', 'restaurant_details', 'items', 'items_total', 'gst', 'instant_charge', 'grand_total', 'created_at', 'updated_at']

    def get_items_total(self, obj):
        return sum(item.price * item.quantity for item in obj.items.all())

    def get_gst(self, obj):
        # GST placeholder (0.00)
        return 0.00

    def get_instant_charge(self, obj):
        # We don't know the checkout choice here, so we return 0.00 or handle it dynamically
        return 0.00

    def get_grand_total(self, obj):
        return self.get_items_total(obj)

class OrderItemSerializer(serializers.ModelSerializer):
    food_item_details = FoodItemSerializer(source='food_item', read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'food_item', 'food_item_details', 'quantity', 'price', 'subtotal']

    def get_subtotal(self, obj):
        return obj.price * obj.quantity

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'status', 'transaction_id', 'method', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    restaurant_details = RestaurantSerializer(source='restaurant', read_only=True)
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    qr_data = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'customer_email', 'restaurant', 'restaurant_details',
            'order_type', 'pickup_time', 'status', 'cancel_reason',
            'total', 'instant_charge', 'gst', 'grand_total',
            'payment_status', 'qr_uuid', 'qr_expired', 'qr_data',
            'items', 'payment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'user', 'qr_uuid', 'qr_expired', 'payment_status', 'created_at', 'updated_at']

    def get_qr_data(self, obj):
        # Return secure QR payload if payment successful
        if obj.payment_status == Order.PaymentStatus.SUCCESS and not obj.qr_expired:
            from ordering.qr import generate_qr_data
            return generate_qr_data(obj)
        return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'is_read', 'notification_type', 'created_at']
        read_only_fields = ['id', 'created_at']
