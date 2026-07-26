from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from accounts.models import Restaurant
from vendor.models import FoodItem, FoodCategory
from ordering.models import Cart, CartItem, Order, OrderItem
from ordering.services import CheckoutService

def get_colleges_list():
    from accounts.models import College
    return list(College.objects.all().values('id', 'name'))

def get_areas_list(college_id):
    return list(Restaurant.objects.filter(vendor__college_id=college_id, vendor__status='APPROVED')
                .values_list('shop_area', flat=True).distinct())

def get_blocks_list(college_id, area):
    return list(Restaurant.objects.filter(vendor__college_id=college_id, vendor__status='APPROVED', shop_area=area)
                .values_list('block', flat=True).distinct())

def get_restaurants_list(college_id, area, block):
    return list(Restaurant.objects.filter(
        vendor__college_id=college_id,
        vendor__status='APPROVED',
        shop_area=area,
        block=block
    ).values('id', 'restaurant_name', 'status'))

def get_restaurant_categories(restaurant_id):
    return list(FoodCategory.objects.filter(restaurant_id=restaurant_id).values('id', 'category_name'))

def get_category_items(category_id):
    return list(FoodItem.objects.filter(category_id=category_id, availability='AVAILABLE').values('id', 'item_name', 'price', 'quantity'))

@transaction.atomic
def add_to_cart_bot(user, food_item_id, quantity=1):
    food_item = FoodItem.objects.get(id=food_item_id)
    cart, _ = Cart.objects.get_or_create(user=user)
    
    # Cart validation (cannot mix restaurants)
    restaurant = food_item.category.restaurant
    if cart.restaurant and cart.restaurant != restaurant:
        # Clear previous cart if restaurant changes
        cart.items.all().delete()
        cart.restaurant = restaurant
    elif not cart.restaurant:
        cart.restaurant = restaurant
    cart.save()

    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        food_item=food_item,
        defaults={'price': food_item.price, 'quantity': 0}
    )
    cart_item.quantity += quantity
    if cart_item.quantity <= 0:
        cart_item.delete()
    else:
        cart_item.save()

    # Sync cart restaurant structure
    if not cart.items.exists():
        cart.restaurant = None
        cart.save()

    return get_cart_details_bot(user)

def get_cart_details_bot(user):
    try:
        cart = Cart.objects.get(user=user)
    except Cart.DoesNotExist:
        return {"items": [], "total": 0.00, "restaurant_name": None}

    items = []
    for item in cart.items.all():
        items.append({
            "id": item.food_item.id,
            "name": item.food_item.item_name,
            "quantity": item.quantity,
            "price": float(item.price),
            "subtotal": float(item.price * item.quantity)
        })
    total = sum(item["subtotal"] for item in items)
    return {
        "items": items,
        "total": float(total),
        "restaurant_name": cart.restaurant.restaurant_name if cart.restaurant else None
    }

def clear_cart_bot(user):
    Cart.objects.filter(user=user).delete()

def checkout_bot(user, order_type, pickup_time=None):
    """
    Executes transaction checkout logic and returns order info.
    """
    order = CheckoutService.process_checkout(user, order_type, pickup_time)
    return order
