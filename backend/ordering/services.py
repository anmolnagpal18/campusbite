from abc import ABC, abstractmethod
import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from ordering.models import Cart, CartItem, Order, OrderItem, Payment, Notification
from ordering.qr import generate_qr_data
from ordering.notifications import create_notification
from vendor.models import FoodItem

class BasePaymentService(ABC):
    @abstractmethod
    def process_payment(self, amount, order):
        pass

class MockPaymentService(BasePaymentService):
    def process_payment(self, amount, order):
        """
        Mock payment integration that always returns a success payload.
        """
        return {
            "success": True,
            "transaction_id": f"TXN-{uuid.uuid4().hex[:12].upper()}",
            "amount": amount,
            "method": "MOCK_WALLET",
            "timestamp": timezone.now()
        }

class RazorpayPaymentService(BasePaymentService):
    def process_payment(self, amount, order):
        """
        Future Razorpay implementation placeholder.
        """
        raise NotImplementedError("Razorpay integration is not yet active.")


class CheckoutService:
    @staticmethod
    @transaction.atomic
    def process_checkout(user, order_type, pickup_time=None):
        """
        Fully transactional checkout flow:
        1. Fetch and lock active cart.
        2. Validate stock availability.
        3. Create Order & OrderItem entries.
        4. Deduct inventory stock.
        5. Process payment via abstract MockPaymentService.
        6. Generate QR payload.
        7. Trigger Notifications.
        8. Clear Cart & restore restaurant association.
        """
        # Lock cart to prevent race conditions
        try:
            cart = Cart.objects.select_for_update().get(user=user)
        except Cart.DoesNotExist:
            raise ValidationError("Cart is empty or does not exist.")

        cart_items = cart.items.all()
        if not cart_items.exists():
            raise ValidationError("Cart is empty.")

        # Check restaurant lock presence
        restaurant = cart.restaurant
        if not restaurant:
            raise ValidationError("Invalid cart configuration: No restaurant assigned.")

        # 1. Stock Validation
        for item in cart_items:
            food_item = item.food_item
            if food_item.availability == 'UNAVAILABLE':
                raise ValidationError(f"Item '{food_item.item_name}' is currently unavailable.")
            if food_item.quantity < item.quantity:
                raise ValidationError(
                    f"Requested quantity of '{food_item.item_name}' ({item.quantity}) exceeds available stock ({food_item.quantity})."
                )

        # 2. Pre-order slot validations
        if order_type == Order.OrderType.PREORDER:
            if not pickup_time:
                raise ValidationError("Pickup time is required for Pre-orders.")
            
            # Ensure time is at least 1 hour in the future
            min_pickup = timezone.now() + timezone.timedelta(hours=1)
            if pickup_time < min_pickup:
                raise ValidationError("Pre-order pickup time must be at least 1 hour in the future.")
        else:
            pickup_time = None

        # 3. Calculate Totals
        total = sum(item.price * item.quantity for item in cart_items)
        instant_charge = Decimal('10.00') if order_type == Order.OrderType.INSTANT else Decimal('0.00')
        gst = Decimal('0.00')  # GST placeholder
        grand_total = total + instant_charge + gst

        # 4. Create Order
        order_number = Order.generate_next_order_number()
        order = Order.objects.create(
            order_number=order_number,
            user=user,
            restaurant=restaurant,
            order_type=order_type,
            pickup_time=pickup_time,
            status=Order.OrderStatus.PENDING,
            total=total,
            instant_charge=instant_charge,
            gst=gst,
            grand_total=grand_total,
            payment_status=Order.PaymentStatus.PENDING
        )

        # 5. Create OrderItems & deduct stock
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                food_item=item.food_item,
                quantity=item.quantity,
                price=item.price
            )
            
            # Inventory deduction
            food_item = item.food_item
            food_item.quantity -= item.quantity
            if food_item.quantity == 0:
                # Optional: auto-toggle availability if stock runs dry
                pass
            food_item.save()

        # 6. Process Payment using the abstract layer
        payment_handler = MockPaymentService()
        txn = payment_handler.process_payment(grand_total, order)

        if txn["success"]:
            Payment.objects.create(
                order=order,
                amount=txn["amount"],
                status=Payment.PaymentStatus.SUCCESS,
                transaction_id=txn["transaction_id"],
                method=txn["method"]
            )
            order.payment_status = Order.PaymentStatus.SUCCESS
            order.save()
        else:
            raise ValidationError("Payment processing failed.")

        # 7. Create Notifications
        create_notification(
            user=user,
            title="Order Placed Successfully",
            message=f"Your order {order.order_number} has been registered and is pending approval.",
            notification_type=Notification.NotificationType.ORDER
        )
        create_notification(
            user=user,
            title="Payment Successful",
            message=f"Processed payment of ₹{grand_total} successfully. Transaction ID: {txn['transaction_id']}.",
            notification_type=Notification.NotificationType.PAYMENT
        )

        # Notify Vendor
        if restaurant.vendor and restaurant.vendor.user:
            create_notification(
                user=restaurant.vendor.user,
                title="New Order Received",
                message=f"You have received a new order {order.order_number} for ₹{grand_total}.",
                notification_type=Notification.NotificationType.ORDER
            )

        # Notify active Staff members
        if restaurant.vendor:
            staff_members = restaurant.vendor.staff_members.filter(
                status='APPROVED',
                user__is_active=True
            )
            for staff in staff_members:
                create_notification(
                    user=staff.user,
                    title="New Order Received",
                    message=f"A new order {order.order_number} for ₹{grand_total} is ready for prep.",
                    notification_type=Notification.NotificationType.ORDER
                )

        # 8. Clear Cart items and reset restaurant association
        cart_items.delete()
        cart.restaurant = None
        cart.save()

        return order
