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
