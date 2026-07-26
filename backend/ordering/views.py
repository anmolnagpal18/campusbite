from django.db import models, transaction
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError

from accounts.models import College, Restaurant
from vendor.models import FoodCategory, FoodItem
from core.enums import ApprovalStatus, ShopStatus, Role
from ordering.models import Cart, CartItem, Order, OrderItem, Payment, Notification
from ordering.serializers import (
    CartSerializer, CartItemSerializer, OrderSerializer, 
    OrderItemSerializer, NotificationSerializer
)
from ordering.services import CheckoutService
from ordering.qr import validate_qr_for_completion
from ordering.notifications import create_notification
from ordering.validators import validate_status_transition
from ordering.permissions import CanManageRestaurantOrder, IsOrderOwner
from dashboard.services import invalidate_dashboard_caches

# -----------------
# Pagination Classes
# -----------------
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

# -----------------
# Colleges, Areas, Blocks & Restaurants
# -----------------
class UserCollegesListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        colleges = College.objects.filter(status=ApprovalStatus.APPROVED, is_deleted=False)
        return Response([{"id": c.id, "name": c.name, "city": c.city} for c in colleges])

class UserAreasListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        college_id = request.query_params.get('college_id')
        if not college_id:
            return Response({"detail": "college_id parameter is required."}, status=400)
            
        areas = Restaurant.objects.filter(
            vendor__college_id=college_id,
            vendor__status=ApprovalStatus.APPROVED,
            vendor__user__is_active=True,
            status=ShopStatus.OPEN,
            accepting_orders=True,
            is_deleted=False
        ).values_list('shop_area', flat=True).distinct()
        
        return Response(list(areas))

class UserBlocksListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        college_id = request.query_params.get('college_id')
        area = request.query_params.get('area')
        if not college_id or not area:
            return Response({"detail": "college_id and area parameters are required."}, status=400)

        blocks = Restaurant.objects.filter(
            vendor__college_id=college_id,
            vendor__status=ApprovalStatus.APPROVED,
            vendor__user__is_active=True,
            shop_area__iexact=area,
            status=ShopStatus.OPEN,
            accepting_orders=True,
            is_deleted=False
        ).values_list('block', flat=True).distinct()

        return Response(list(blocks))

class UserRestaurantsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        college_id = request.query_params.get('college_id')
        area = request.query_params.get('area')
        block = request.query_params.get('block')
        
        qs = Restaurant.objects.filter(
            vendor__status=ApprovalStatus.APPROVED,
            vendor__user__is_active=True,
            status=ShopStatus.OPEN,
            accepting_orders=True,
            is_deleted=False
        )
        
        if college_id:
            qs = qs.filter(vendor__college_id=college_id)
        if area:
            qs = qs.filter(shop_area__iexact=area)
        if block:
            qs = qs.filter(block__iexact=block)

        data = []
        for r in qs:
            cat_count = r.categories.filter(status='ACTIVE', is_deleted=False).count()
            items_count = FoodItem.objects.filter(category__restaurant=r, category__status='ACTIVE', availability='AVAILABLE', is_deleted=False).count()
            data.append({
                "id": r.id,
                "restaurant_name": r.restaurant_name,
                "shop_area": r.shop_area,
                "block": r.block,
                "opening_time": r.opening_time.strftime('%H:%M') if r.opening_time else None,
                "closing_time": r.closing_time.strftime('%H:%M') if r.closing_time else None,
                "status": r.status,
                "accepting_orders": r.accepting_orders,
                "is_currently_open": r.is_currently_open,
                "category_count": cat_count,
                "food_items_count": items_count,
                "rating": 4.5  # placeholder
            })

        return Response(data)

class UserRestaurantDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        try:
            restaurant = Restaurant.objects.get(
                pk=id,
                vendor__status=ApprovalStatus.APPROVED,
                vendor__user__is_active=True,
                status=ShopStatus.OPEN,
                accepting_orders=True,
                is_deleted=False
            )
        except Restaurant.DoesNotExist:
            return Response({"detail": "Restaurant not found or is closed."}, status=444)

        categories = restaurant.categories.filter(status='ACTIVE', is_deleted=False).order_by('display_order')
        categories_data = []
        for cat in categories:
            items = cat.items.filter(is_deleted=False).order_by('display_order')
            items_data = []
            for item in items:
                items_data.append({
                    "id": item.id,
                    "item_name": item.item_name,
                    "description": item.description,
                    "price": item.price,
                    "quantity": item.quantity,
                    "availability": item.availability,
                    "food_image": item.food_image.url if item.food_image else None,
                    "food_thumbnail": item.food_thumbnail.url if item.food_thumbnail else None
                })
            categories_data.append({
                "id": cat.id,
                "category_name": cat.category_name,
                "items": items_data
            })

        return Response({
            "id": restaurant.id,
            "restaurant_name": restaurant.restaurant_name,
            "shop_area": restaurant.shop_area,
            "block": restaurant.block,
            "opening_time": restaurant.opening_time.strftime('%H:%M') if restaurant.opening_time else None,
            "closing_time": restaurant.closing_time.strftime('%H:%M') if restaurant.closing_time else None,
            "status": restaurant.status,
            "accepting_orders": restaurant.accepting_orders,
            "is_currently_open": restaurant.is_currently_open,
            "categories": categories_data
        })

# -----------------
# Cart operations
# -----------------
class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        food_item_id = request.data.get('food_item_id')
        qty = int(request.data.get('quantity', 1))
        
        if not food_item_id or qty <= 0:
            return Response({"detail": "Valid food_item_id and positive quantity are required."}, status=400)

        try:
            food_item = FoodItem.objects.get(pk=food_item_id, is_deleted=False)
        except FoodItem.DoesNotExist:
            return Response({"detail": "Food item not found."}, status=444)

        if food_item.availability == 'UNAVAILABLE':
            return Response({"detail": "This item is currently out of stock/unavailable."}, status=400)

        restaurant = food_item.category.restaurant
        cart, _ = Cart.objects.get_or_create(user=request.user)

        # 1. Restaurant Lock Check
        if cart.restaurant and cart.restaurant != restaurant:
            return Response({
                "code": "RESTAURANT_CONFLICT",
                "detail": "Your cart already contains items from another restaurant."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Ensure restaurant link is set
        if not cart.restaurant:
            cart.restaurant = restaurant
            cart.save()

        # 2. Quantity Limit Check
        existing_item = cart.items.filter(food_item=food_item).first()
        current_qty = existing_item.quantity if existing_item else 0
        target_qty = current_qty + qty

        if food_item.quantity < target_qty:
            return Response({"detail": f"Cannot add {qty} more. Only {food_item.quantity} available in stock."}, status=400)

        if existing_item:
            existing_item.quantity = target_qty
            existing_item.price = food_item.price
            existing_item.save()
        else:
            CartItem.objects.create(
                cart=cart,
                food_item=food_item,
                quantity=qty,
                price=food_item.price
            )

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def put(self, request):
        item_id = request.data.get('item_id')
        qty = int(request.data.get('quantity', 1))

        try:
            cart_item = CartItem.objects.get(pk=item_id, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found."}, status=444)

        cart = cart_item.cart

        if qty <= 0:
            cart_item.delete()
            # If cart is now empty, reset restaurant association
            if not cart.items.exists():
                cart.restaurant = None
                cart.save()
        else:
            # Check stock
            food_item = cart_item.food_item
            if food_item.quantity < qty:
                return Response({"detail": f"Only {food_item.quantity} items available in stock."}, status=400)

            cart_item.quantity = qty
            cart_item.price = food_item.price
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        cart.restaurant = None
        cart.save()
        return Response({"message": "Cart cleared successfully."})

class CartItemDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, id):
        try:
            cart_item = CartItem.objects.get(pk=id, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found."}, status=444)

        cart = cart_item.cart
        cart_item.delete()

        # If empty, reset restaurant
        if not cart.items.exists():
            cart.restaurant = None
            cart.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

# -----------------
# Checkout Flow
# -----------------
class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_type = request.data.get('order_type')
        pickup_time_str = request.data.get('pickup_time')
        
        if order_type not in (Order.OrderType.INSTANT, Order.OrderType.PREORDER):
            return Response({"detail": "Invalid order_type parameter."}, status=400)

        pickup_time = None
        if order_type == Order.OrderType.PREORDER:
            if not pickup_time_str:
                return Response({"detail": "pickup_time is required for Pre-orders."}, status=400)
            try:
                pickup_time = timezone.datetime.fromisoformat(pickup_time_str)
                # Convert to local timezone if naive
                if timezone.is_naive(pickup_time):
                    pickup_time = timezone.make_aware(pickup_time)
            except ValueError:
                return Response({"detail": "Invalid date format for pickup_time."}, status=400)

        try:
            order = CheckoutService.process_checkout(
                user=request.user,
                order_type=order_type,
                pickup_time=pickup_time
            )
            invalidate_dashboard_caches()
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({"detail": e.detail[0] if isinstance(e.detail, list) else str(e.detail)}, status=400)
        except Exception as e:
            return Response({"detail": str(e)}, status=500)

# -----------------
# Order Management View
# -----------------
class OrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        status_filter = request.query_params.get('status')
        
        # 1. Customer listings
        if user.role == Role.USER:
            orders = Order.objects.filter(user=user, is_deleted=False)
            
        # 2. Vendor listings (assigned canteens)
        elif user.role == Role.VENDOR:
            try:
                vendor_profile = user.vendor_profile
                orders = Order.objects.filter(restaurant__vendor=vendor_profile, is_deleted=False)
            except AttributeError:
                orders = Order.objects.none()
                
        # 3. Staff listings (assigned canteens)
        elif user.role == Role.STAFF:
            try:
                staff_profile = user.staff_profile
                orders = Order.objects.filter(restaurant__vendor=staff_profile.vendor, is_deleted=False)
            except AttributeError:
                orders = Order.objects.none()
        else:
            orders = Order.objects.none()

        if status_filter:
            orders = orders.filter(status=status_filter)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(orders, request, view=self)
        if page is not None:
            serializer = OrderSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        try:
            order = Order.objects.get(pk=id, is_deleted=False)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=444)

        # Access check
        is_owner = order.user == request.user
        is_handler = False
        
        if request.user.role == Role.VENDOR:
            is_handler = hasattr(request.user, 'vendor_profile') and order.restaurant.vendor == request.user.vendor_profile
        elif request.user.role == Role.STAFF:
            is_handler = hasattr(request.user, 'staff_profile') and order.restaurant.vendor == request.user.staff_profile.vendor

        if not is_owner and not is_handler:
            return Response({"detail": "Access Denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderSerializer(order)
        return Response(serializer.data)

class OrdersStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, CanManageRestaurantOrder]

    def put(self, request):
        order_id = request.data.get('order_id')
        next_status = request.data.get('status')
        cancel_reason = request.data.get('cancel_reason', '')

        if not order_id or not next_status:
            return Response({"detail": "order_id and status are required."}, status=400)

        try:
            order = Order.objects.get(pk=order_id, is_deleted=False)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=444)

        self.check_object_permissions(request, order)

        try:
            validate_status_transition(order, next_status, request.user)
        except ValidationError as e:
            return Response({"detail": str(e.detail[0])}, status=400)

        with transaction.atomic():
            order.status = next_status
            if next_status == Order.OrderStatus.CANCELLED:
                order.cancel_reason = cancel_reason
                # Return items back to stock
                for item in order.items.all():
                    food_item = item.food_item
                    food_item.quantity += item.quantity
                    food_item.save()
            order.save()
            invalidate_dashboard_caches()

            # Status Trigger Notifications
            status_labels = {
                Order.OrderStatus.PREPARING: ("Order Preparing", f"Your order {order.order_number} is being prepared in the kitchen."),
                Order.OrderStatus.READY: ("Order Ready for Pickup", f"Your order {order.order_number} is ready. Show your QR to collect your meal!"),
                Order.OrderStatus.COMPLETED: ("Order Completed", f"Your order {order.order_number} has been collected successfully."),
                Order.OrderStatus.CANCELLED: ("Order Cancelled", f"Your order {order.order_number} was cancelled. Reason: {cancel_reason or 'No reason provided.'}")
            }

            if next_status in status_labels:
                title, msg = status_labels[next_status]
                create_notification(
                    user=order.user,
                    title=title,
                    message=msg,
                    notification_type=Notification.NotificationType.ORDER
                )

                # Vendor Thank You Message automatically sent when order becomes COMPLETED
                if next_status == Order.OrderStatus.COMPLETED:
                    thank_you_msg = (
                        f"Thank you for ordering from {order.restaurant.restaurant_name}! "
                        "We hope you enjoyed your meal. Looking forward to serving you again."
                    )
                    create_notification(
                        user=order.user,
                        title=f"Thank you from {order.restaurant.restaurant_name}",
                        message=thank_you_msg,
                        notification_type=Notification.NotificationType.ORDER
                    )

        serializer = OrderSerializer(order)
        return Response(serializer.data)

# -----------------
# QR Code Scanner View
# -----------------
class ScanQRView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        order_uuid = request.data.get('order_uuid')
        qr_image = request.FILES.get('qr_image')

        # Fallback/Image decoding mechanism
        if qr_image:
            try:
                from PIL import Image
                img = Image.open(qr_image)
                try:
                    from pyzbar.pyzbar import decode
                    decoded_objs = decode(img)
                    if decoded_objs:
                        # Extract token data from QR
                        token = decoded_objs[0].data.decode('utf-8')
                        import json
                        if token.startswith('{'):
                            qr_dict = json.loads(token)
                            order_uuid = qr_dict.get('order_uuid')
                            token = qr_dict.get('encrypted_token')
                except ImportError:
                    pass
            except Exception:
                return Response({"detail": "Failed to process QR image upload. Try copy-pasting the token manually."}, status=400)

        if not token or not order_uuid:
            return Response({"detail": "Valid QR token and order UUID are required."}, status=400)

        # 1. Validate QR completion checks
        order, err = validate_qr_for_completion(order_uuid, token)
        if err:
            return Response({"detail": err}, status=400)

        # 2. Restrict scanning to assigned vendor/staff only
        user = request.user
        is_authorized = False
        if user.role == Role.VENDOR:
            is_authorized = hasattr(user, 'vendor_profile') and order.restaurant.vendor == user.vendor_profile
        elif user.role == Role.STAFF:
            is_authorized = hasattr(user, 'staff_profile') and order.restaurant.vendor == user.staff_profile.vendor

        if not is_authorized:
            return Response({"detail": "You are not authorized to scan or complete orders for this restaurant."}, status=status.HTTP_403_FORBIDDEN)

        # 3. Mark completed and expire QR
        with transaction.atomic():
            order.status = Order.OrderStatus.COMPLETED
            order.qr_expired = True
            order.save()
            invalidate_dashboard_caches()

            # Notifications
            create_notification(
                user=order.user,
                title="Order Collected",
                message=f"Order {order.order_number} has been verified and picked up successfully.",
                notification_type=Notification.NotificationType.ORDER
            )
            
            # Send thank you notification
            thank_you_msg = (
                f"Thank you for ordering from {order.restaurant.restaurant_name}! "
                "We hope you enjoyed your meal. Looking forward to serving you again."
            )
            create_notification(
                user=order.user,
                title=f"Thank you from {order.restaurant.restaurant_name}",
                message=thank_you_msg,
                notification_type=Notification.NotificationType.ORDER
            )

        serializer = OrderSerializer(order)
        return Response(serializer.data)

# -----------------
# Notifications views
# -----------------
class NotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        unread_only = request.query_params.get('unread')
        qs = Notification.objects.filter(user=request.user)
        
        if unread_only == 'true':
            qs = qs.filter(is_read=False)

        serializer = NotificationSerializer(qs, many=True)
        return Response(serializer.data)

class NotificationsMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."})

class NotificationDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            n = Notification.objects.get(pk=pk, user=request.user)
            n.delete()
            return Response({"message": "Notification deleted."})
        except Notification.DoesNotExist:
            return Response({"detail": "Notification not found."}, status=444)
