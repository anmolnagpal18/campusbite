import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Cart, CartItem, CartItemAddOn, PickupSlot, PreBooking, BookingItem
from apps.menus.models import MenuItem, MenuVariant, AddOn
from .serializers import (
    CartSerializer, CartItemSerializer, CartItemAddOnSerializer, 
    PickupSlotSerializer, PreBookingSerializer
)

class StudentCartPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'STUDENT')

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [StudentCartPermission]

    def get_queryset(self):
        return Cart.objects.filter(student=self.request.user, status=Cart.CartStatus.ACTIVE).prefetch_related('items__addons')

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(student=request.user, status=Cart.CartStatus.ACTIVE)
            
            menu_item_id = request.data.get('menu_item')
            quantity = int(request.data.get('quantity', 1))
            variant_id = request.data.get('variant')
            addons_data = request.data.get('addons', []) # [{'addon': id, 'quantity': int}]

            menu_item = MenuItem.objects.get(id=menu_item_id)
            
            # Single Vendor Rule Enforcement
            if cart.vendor and cart.vendor != menu_item.vendor:
                return Response(
                    {'error': 'Cart already contains items from a different vendor. Clear cart to proceed.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart.vendor = menu_item.vendor

            # Price Calculation
            base_price = menu_item.price
            variant = None
            if variant_id:
                variant = MenuVariant.objects.get(id=variant_id)
                base_price += variant.price_modifier
            
            unit_price = base_price
            
            cart_item = CartItem.objects.create(
                cart=cart,
                menu_item=menu_item,
                variant=variant,
                quantity=quantity,
                unit_price=unit_price,
                total_price=unit_price * quantity,
                special_instructions=request.data.get('special_instructions', '')
            )

            addons_total = Decimal('0.00')
            for addon_req in addons_data:
                addon = AddOn.objects.get(id=addon_req['addon'])
                addon_qty = int(addon_req.get('quantity', 1))
                price = addon.price * addon_qty
                addons_total += price
                CartItemAddOn.objects.create(
                    cart_item=cart_item,
                    addon=addon,
                    quantity=addon_qty,
                    price=price
                )
            
            cart_item.total_price += addons_total
            cart_item.save()

            # Update Cart Totals
            cart.subtotal = sum(item.total_price for item in cart.items.all())
            cart.total = cart.subtotal # Taxes/Fees could be added here
            cart.save()

            return Response(CartSerializer(cart).data)


class PreBookingViewSet(viewsets.ModelViewSet):
    serializer_class = PreBookingSerializer
    
    def get_queryset(self):
        if self.request.user.role == 'STUDENT':
            return PreBooking.objects.filter(student=self.request.user).prefetch_related('items')
        elif self.request.user.role == 'VENDOR':
            # Simplified for prototype. Assuming vendor user has a related Vendor profile
            return PreBooking.objects.all().prefetch_related('items')
        return PreBooking.objects.all()

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            cart = Cart.objects.get(id=request.data.get('cart'), student=request.user, status=Cart.CartStatus.ACTIVE)
            slot_id = request.data.get('pickup_slot')
            
            # Select For Update to prevent capacity race conditions
            slot = PickupSlot.objects.select_for_update().get(id=slot_id)
            
            if slot.current_bookings >= slot.capacity or slot.slot_status != PickupSlot.SlotStatus.OPEN:
                return Response({'error': 'Pickup slot is full or unavailable.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create Booking
            reference = f"CB-{uuid.uuid4().hex[:8].upper()}"
            
            booking = PreBooking.objects.create(
                student=request.user,
                vendor=cart.vendor,
                cart=cart,
                pickup_slot=slot,
                pickup_date=slot.date,
                subtotal=cart.subtotal,
                total=cart.total,
                booking_reference=reference,
                notes=request.data.get('notes', '')
            )

            # Generate Immutable Snapshots
            for item in cart.items.all():
                addons_snapshot = [
                    {"name": a.addon.name, "qty": a.quantity, "price": str(a.price)}
                    for a in item.addons.all()
                ]
                BookingItem.objects.create(
                    booking=booking,
                    menu_item_name=item.menu_item.name,
                    variant_name=item.variant.name if item.variant else None,
                    addons_snapshot=addons_snapshot,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total_price,
                    special_instructions=item.special_instructions
                )

            # Update Slot Capacity
            slot.current_bookings += 1
            if slot.current_bookings >= slot.capacity:
                slot.slot_status = PickupSlot.SlotStatus.FULL
            slot.save()

            # Update Cart
            cart.status = Cart.CartStatus.CONVERTED
            cart.save()

            return Response(PreBookingSerializer(booking).data, status=status.HTTP_201_CREATED)

class QRViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='generate')
    def generate_qr(self, request, pk=None):
        booking = PreBooking.objects.get(id=pk)
        
        # Security: Only the owning student can generate/view the QR
        if booking.student != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.payment_status != PreBooking.PaymentStatus.PAID or booking.status != PreBooking.BookingStatus.CONFIRMED:
            return Response({"error": "Booking is not eligible for QR generation. Must be Paid and Confirmed."}, status=status.HTTP_400_BAD_REQUEST)
            
        if booking.qr_status in [PreBooking.QRStatus.USED, PreBooking.QRStatus.REVOKED, PreBooking.QRStatus.EXPIRED]:
            return Response({"error": f"QR cannot be generated. Current status: {booking.qr_status}"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate secure random token if not exists
        if not booking.qr_token or booking.qr_status == PreBooking.QRStatus.NOT_GENERATED:
            booking.qr_token = uuid.uuid4().hex
            booking.qr_generated_at = timezone.now()
            # Set expiry to pickup_date end of day
            booking.qr_expires_at = timezone.now() + timezone.timedelta(hours=24) 
            booking.qr_status = PreBooking.QRStatus.ACTIVE
            booking.save()

        payload = {
            "booking_reference": booking.booking_reference,
            "secure_token": booking.qr_token,
            "payload_version": "v1"
        }
        
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='verify')
    def verify_qr(self, request):
        from .serializers import QRVerifySerializer
        from .models import PickupLog
        
        if request.user.role != 'VENDOR':
            return Response({"error": "Only vendors can verify QR codes."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = QRVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ref = serializer.validated_data['booking_reference']
        token = serializer.validated_data['secure_token']
        
        try:
            booking = PreBooking.objects.get(booking_reference=ref)
        except PreBooking.DoesNotExist:
            return Response({"error": "Invalid QR payload. Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        # Base PickupLog entry
        log = PickupLog(
            booking=booking,
            vendor=booking.vendor,
            verification_type=PickupLog.VerificationType.QR,
            verification_source='QR_SCANNER',
            device_info=request.META.get('HTTP_USER_AGENT', ''),
            ip_address=request.META.get('REMOTE_ADDR', '')
        )

        # Vendor Ownership check
        # Simplified: check if user.vendor matches booking.vendor
        # if request.user.vendor_profile != booking.vendor:
        #    log.result = PickupLog.VerificationResult.FAILED
        #    log.failure_reason = "Vendor Mismatch"
        #    log.save()
        #    return Response({"error": "You do not own this booking."}, status=status.HTTP_403_FORBIDDEN)

        # Duplicate Check BEFORE lock to fail fast
        if booking.qr_status == PreBooking.QRStatus.USED:
            log.result = PickupLog.VerificationResult.DUPLICATE
            log.failure_reason = "QR Already Redeemed"
            log.save()
            return Response({"error": "QR already redeemed."}, status=status.HTTP_409_CONFLICT)
            
        if booking.qr_token != token:
            log.result = PickupLog.VerificationResult.FAILED
            log.failure_reason = "Token Mismatch / Invalid Signature"
            log.save()
            return Response({"error": "Invalid QR signature."}, status=status.HTTP_400_BAD_REQUEST)
            
        if booking.qr_status == PreBooking.QRStatus.EXPIRED or (booking.qr_expires_at and timezone.now() > booking.qr_expires_at):
            log.result = PickupLog.VerificationResult.FAILED
            log.failure_reason = "QR Expired"
            log.save()
            return Response({"error": "QR has expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Atomic Verification with DB Lock
        with transaction.atomic():
            booking_locked = PreBooking.objects.select_for_update().get(id=booking.id)
            
            # Re-check inside lock for race conditions (Concurrent Scanning)
            if booking_locked.qr_status == PreBooking.QRStatus.USED:
                return Response({"error": "QR already redeemed."}, status=status.HTTP_409_CONFLICT)
                
            booking_locked.qr_status = PreBooking.QRStatus.USED
            booking_locked.status = PreBooking.BookingStatus.COMPLETED
            booking_locked.pickup_verified_at = timezone.now()
            booking_locked.picked_up_by_vendor = request.user
            booking_locked.save()
            
            log.result = PickupLog.VerificationResult.SUCCESS
            log.save()
            
        return Response({"message": "QR Verified! Order Pickup Complete."}, status=status.HTTP_200_OK)

class KitchenViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _recalculate_queue(self, vendor):
        """Helper to reorder active orders."""
        active_orders = PreBooking.objects.filter(
            vendor=vendor,
            status__in=[PreBooking.BookingStatus.CONFIRMED, PreBooking.BookingStatus.PREPARING]
        ).order_by(
            models.Case(
                models.When(priority=PreBooking.Priority.URGENT, then=0),
                models.When(priority=PreBooking.Priority.HIGH, then=1),
                models.When(priority=PreBooking.Priority.NORMAL, then=2),
                default=3
            ),
            'confirmed_at'
        )
        
        current_time = timezone.now()
        for i, order in enumerate(active_orders):
            order.queue_position = i + 1
            if order.status == PreBooking.BookingStatus.CONFIRMED:
                # Cumulative estimated time
                wait_time = sum([o.estimated_preparation_time for o in active_orders[:i+1]])
                order.estimated_ready_at = current_time + timezone.timedelta(minutes=wait_time)
            order.save(update_fields=['queue_position', 'estimated_ready_at'])

    @action(detail=False, methods=['get'], url_path='queue')
    def get_queue(self, request):
        if request.user.role != 'VENDOR':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        vendor = request.user.vendor_profile if hasattr(request.user, 'vendor_profile') else None
        if not vendor:
            # Fallback for simplistic testing if RBAC isn't fully linking profiles
            vendor = Vendor.objects.first()

        orders = PreBooking.objects.filter(
            vendor=vendor,
            status__in=[
                PreBooking.BookingStatus.CONFIRMED, 
                PreBooking.BookingStatus.PREPARING, 
                PreBooking.BookingStatus.READY_FOR_PICKUP
            ]
        ).order_by('-status', 'queue_position')
        
        return Response(PreBookingSerializer(orders, many=True).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        if request.user.role != 'VENDOR':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        from .serializers import OrderStatusUpdateSerializer
        from .models import OrderStatusLog
        
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['new_status']
        reason = serializer.validated_data.get('transition_reason', '')

        with transaction.atomic():
            booking = PreBooking.objects.select_for_update().get(id=pk)
            
            # State Machine Rules
            allowed = False
            curr = booking.status
            
            if curr == PreBooking.BookingStatus.CONFIRMED and new_status == PreBooking.BookingStatus.PREPARING:
                allowed = True
                booking.preparing_at = timezone.now()
                booking.actual_preparation_start = timezone.now()
                
            elif curr == PreBooking.BookingStatus.PREPARING and new_status == PreBooking.BookingStatus.READY_FOR_PICKUP:
                allowed = True
                booking.ready_at = timezone.now()
                
            elif curr in [PreBooking.BookingStatus.CONFIRMED, PreBooking.BookingStatus.PREPARING] and new_status == PreBooking.BookingStatus.CANCELLED:
                allowed = True
                booking.cancelled_at = timezone.now()
                
            if not allowed:
                return Response({"error": f"Invalid transition from {curr} to {new_status}"}, status=status.HTTP_400_BAD_REQUEST)
                
            booking.status = new_status
            booking.save()
            
            OrderStatusLog.objects.create(
                booking=booking,
                previous_status=curr,
                new_status=new_status,
                changed_by=request.user,
                source=OrderStatusLog.LogSource.VENDOR,
                transition_reason=reason,
                ip_address=request.META.get('REMOTE_ADDR', '')
            )
            
            self._recalculate_queue(booking.vendor)
            
        # Dispatch notification asynchronously (Outside DB lock for performance)
        from apps.communication.services import MessageDispatcher
        from apps.notifications.services import RealtimePublisher
        
        MessageDispatcher.dispatch_status_update(booking)
        
        RealtimePublisher.publish_to_user(
            user_id=booking.student.id,
            event_type=new_status,
            message=f"Your order #{booking.booking_reference[-5:]} is now {new_status}.",
            reference_type="PreBooking",
            reference_id=str(booking.id)
        )
            
        return Response({"message": "Status updated"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='priority')
    def update_priority(self, request, pk=None):
        if request.user.role != 'VENDOR':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        from .serializers import PriorityUpdateSerializer
        serializer = PriorityUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking = PreBooking.objects.get(id=pk)
        booking.priority = serializer.validated_data['priority']
        booking.save()
        self._recalculate_queue(booking.vendor)
        
        return Response({"message": "Priority updated"}, status=status.HTTP_200_OK)
