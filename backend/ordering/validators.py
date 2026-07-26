from rest_framework.exceptions import ValidationError
from core.enums import Role
from ordering.models import Order

def validate_status_transition(order, next_status, user):
    """
    Enforces status progression rules:
    - User is never allowed to change status.
    - Progressive transitions:
      PENDING -> PREPARING
      PREPARING -> READY
      READY -> COMPLETED
    - Cancellation rules:
      - Vendor can cancel from PENDING, PREPARING, or READY.
      - Staff CANNOT cancel orders.
    """
    current_status = order.status
    
    if current_status == next_status:
        return True

    # 1. Block user changes
    if user.role == Role.USER:
        raise ValidationError("Customers are not permitted to change order status.")

    # 2. Block direct transition to COMPLETED (must be done via QR scan)
    if next_status == Order.OrderStatus.COMPLETED:
        raise ValidationError("Orders can only be marked as completed by scanning the customer's pickup QR code.")

    # 3. Block completed or cancelled order modifications
    if current_status in (Order.OrderStatus.COMPLETED, Order.OrderStatus.CANCELLED):
        raise ValidationError(f"Cannot transition order from finished status '{current_status}'.")

    # 3. Staff specific rules
    if user.role == Role.STAFF:
        if next_status == Order.OrderStatus.CANCELLED:
            raise ValidationError("Staff members are not authorized to cancel orders.")
            
        allowed_staff_moves = {
            Order.OrderStatus.PENDING: [Order.OrderStatus.PREPARING],
            Order.OrderStatus.PREPARING: [Order.OrderStatus.READY],
            Order.OrderStatus.READY: [Order.OrderStatus.COMPLETED]
        }
        valid_next = allowed_staff_moves.get(current_status, [])
        if next_status not in valid_next:
            raise ValidationError(
                f"Invalid status transition for staff: '{current_status}' cannot move to '{next_status}'."
            )
        return True

    # 4. Vendor rules
    if user.role == Role.VENDOR:
        allowed_vendor_moves = {
            Order.OrderStatus.PENDING: [Order.OrderStatus.PREPARING, Order.OrderStatus.CANCELLED],
            Order.OrderStatus.PREPARING: [Order.OrderStatus.READY, Order.OrderStatus.CANCELLED],
            Order.OrderStatus.READY: [Order.OrderStatus.COMPLETED, Order.OrderStatus.CANCELLED]
        }
        valid_next = allowed_vendor_moves.get(current_status, [])
        if next_status not in valid_next:
            raise ValidationError(
                f"Invalid status transition for vendor: '{current_status}' cannot move to '{next_status}'."
            )
        return True

    raise ValidationError("Role not authorized to perform status changes.")
