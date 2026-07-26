from django.core import signing
from ordering.models import Order

def generate_qr_data(order):
    """
    Generates QR code payload including order UUID and signed/encrypted token.
    """
    # Securely sign just the order UUID string
    token = signing.dumps(str(order.qr_uuid))
    return {
        "order_uuid": str(order.qr_uuid),
        "encrypted_token": token,
        "created_at": order.created_at.isoformat()
    }

def verify_qr_token(token):
    """
    Decrypts and validates the signed token.
    Returns payload data or raises signing exception.
    """
    try:
        # Verify the signature
        data = signing.loads(token)
        return data, None
    except signing.SignatureExpired:
        return None, "QR Code signature has expired."
    except signing.BadSignature:
        return None, "Invalid QR Code signature."

def validate_qr_for_completion(order_uuid, token):
    """
    Comprehensive QR verification:
    - Order exists
    - Token matches and decrypts correctly
    - Payment is successful
    - QR is not expired
    - Order is not already completed/cancelled
    """
    try:
        order = Order.objects.get(qr_uuid=order_uuid, is_deleted=False)
    except (Order.DoesNotExist, ValueError):
        return None, "Order matching this QR code does not exist."

    # 1. Decrypt/verify token
    data, err = verify_qr_token(token)
    if err:
        return None, err

    # 2. Verify token matches this order
    if data != str(order.qr_uuid):
        return None, "QR token does not match the requested order."

    # 3. Check payment status
    if order.payment_status != Order.PaymentStatus.SUCCESS:
        return None, "Payment has not been completed successfully for this order."

    # 4. Check QR expiration
    if order.qr_expired:
        return None, "QR Already Used"

    # 5. Check order status
    if order.status == Order.OrderStatus.COMPLETED:
        return None, "Order has already been completed."
    if order.status == Order.OrderStatus.CANCELLED:
        return None, f"Order is cancelled. Reason: {order.cancel_reason or 'No reason provided'}"

    return order, None
