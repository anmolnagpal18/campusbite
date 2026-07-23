import razorpay
from django.conf import settings
from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .models import Payment, PaymentLog
from apps.orders.models import PreBooking
from .serializers import PaymentSerializer, RazorpayOrderSerializer, RazorpayVerificationSerializer

# Note: In a real project, these would be in settings.py / .env
RAZORPAY_KEY_ID = getattr(settings, 'RAZORPAY_KEY_ID', 'test_key_id')
RAZORPAY_KEY_SECRET = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_key_secret')

rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class PaymentViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'STUDENT':
            return Payment.objects.filter(student=self.request.user)
        return Payment.objects.all()

    @action(detail=False, methods=['post'], url_path='create-order')
    def create_order(self, request):
        serializer = RazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.validated_data['pre_booking_id']

        if booking.student != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Create Razorpay Order
        amount_in_paise = int(booking.total * 100)
        
        try:
            rzp_order = rzp_client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": booking.booking_reference,
                "notes": {
                    "booking_id": booking.id
                }
            })
        except Exception as e:
            return Response({"error": "Failed to communicate with Razorpay"}, status=status.HTTP_502_BAD_GATEWAY)

        with transaction.atomic():
            payment = Payment.objects.create(
                student=request.user,
                vendor=booking.vendor,
                pre_booking=booking,
                razorpay_order_id=rzp_order['id'],
                amount=booking.total,
                status=Payment.PaymentStatus.CREATED
            )
            PaymentLog.objects.create(
                payment=payment,
                event_type="ORDER_CREATED",
                description="Razorpay order initialized."
            )

        return Response({
            "payment_id": payment.id,
            "razorpay_order_id": rzp_order['id'],
            "amount": amount_in_paise,
            "currency": "INR",
            "key": RAZORPAY_KEY_ID
        })

    @action(detail=False, methods=['post'], url_path='verify')
    def verify_payment(self, request):
        serializer = RazorpayVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rzp_order_id = serializer.validated_data['razorpay_order_id']
        rzp_payment_id = serializer.validated_data['razorpay_payment_id']
        rzp_signature = serializer.validated_data['razorpay_signature']

        try:
            payment = Payment.objects.get(razorpay_order_id=rzp_order_id)
        except Payment.DoesNotExist:
            return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == Payment.PaymentStatus.SUCCESS:
            return Response({"message": "Payment already verified successfully."}, status=status.HTTP_200_OK)

        # Verify Signature
        try:
            rzp_client.utility.verify_payment_signature({
                'razorpay_order_id': rzp_order_id,
                'razorpay_payment_id': rzp_payment_id,
                'razorpay_signature': rzp_signature
            })
        except razorpay.errors.SignatureVerificationError:
            with transaction.atomic():
                payment.status = Payment.PaymentStatus.FAILED
                payment.failure_reason = "Signature Verification Failed"
                payment.save()
                PaymentLog.objects.create(payment=payment, event_type="SIGNATURE_FAILED")
            return Response({"error": "Invalid Payment Signature"}, status=status.HTTP_400_BAD_REQUEST)

        # Success Transaction
        with transaction.atomic():
            # Lock booking to prevent race conditions during status update
            booking = PreBooking.objects.select_for_update().get(id=payment.pre_booking_id)
            
            payment.razorpay_payment_id = rzp_payment_id
            payment.razorpay_signature = rzp_signature
            payment.status = Payment.PaymentStatus.SUCCESS
            payment.save()
            
            booking.payment_status = PreBooking.PaymentStatus.PAID
            booking.status = PreBooking.BookingStatus.CONFIRMED
            booking.save()

            PaymentLog.objects.create(payment=payment, event_type="PAYMENT_SUCCESS", description="Signature verified via API.")

        return Response({"message": "Payment successful and booking confirmed!"}, status=status.HTTP_200_OK)


class RazorpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny] # Razorpay hits this without JWT

    def post(self, request):
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', 'test_webhook_secret')

        try:
            rzp_client.utility.verify_webhook_signature(
                request.body.decode('utf-8'),
                webhook_signature,
                webhook_secret
            )
        except razorpay.errors.SignatureVerificationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        payload = request.data
        event = payload.get('event')
        
        if event == 'payment.captured':
            order_id = payload['payload']['payment']['entity']['order_id']
            try:
                payment = Payment.objects.get(razorpay_order_id=order_id)
                if payment.status != Payment.PaymentStatus.SUCCESS:
                    with transaction.atomic():
                        booking = PreBooking.objects.select_for_update().get(id=payment.pre_booking_id)
                        payment.status = Payment.PaymentStatus.SUCCESS
                        payment.save()
                        booking.payment_status = PreBooking.PaymentStatus.PAID
                        booking.status = PreBooking.BookingStatus.CONFIRMED
                        booking.save()
                        PaymentLog.objects.create(payment=payment, event_type="WEBHOOK_CAPTURED", payload=payload)
            except Payment.DoesNotExist:
                pass

        elif event == 'payment.failed':
            order_id = payload['payload']['payment']['entity']['order_id']
            try:
                payment = Payment.objects.get(razorpay_order_id=order_id)
                if payment.status != Payment.PaymentStatus.SUCCESS:
                    with transaction.atomic():
                        payment.status = Payment.PaymentStatus.FAILED
                        payment.save()
                        PaymentLog.objects.create(payment=payment, event_type="WEBHOOK_FAILED", payload=payload)
            except Payment.DoesNotExist:
                pass

        return Response(status=status.HTTP_200_OK)
