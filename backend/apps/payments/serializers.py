from rest_framework import serializers
from .models import Payment, PaymentLog
from apps.orders.models import PreBooking

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['payment_reference', 'status', 'gateway_response', 'failure_reason', 'refund_status']

class RazorpayOrderSerializer(serializers.Serializer):
    pre_booking_id = serializers.IntegerField()

    def validate_pre_booking_id(self, value):
        try:
            booking = PreBooking.objects.get(id=value)
            if booking.payment_status == PreBooking.PaymentStatus.PAID:
                raise serializers.ValidationError("This booking is already paid for.")
            if booking.status in [PreBooking.BookingStatus.CANCELLED, PreBooking.BookingStatus.EXPIRED]:
                raise serializers.ValidationError("Cannot pay for a cancelled or expired booking.")
            return booking
        except PreBooking.DoesNotExist:
            raise serializers.ValidationError("Booking does not exist.")

class RazorpayVerificationSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=255)
    razorpay_payment_id = serializers.CharField(max_length=255)
    razorpay_signature = serializers.CharField(max_length=512)
