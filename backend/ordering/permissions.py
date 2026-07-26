from rest_framework import permissions
from core.enums import Role

class IsOrderOwner(permissions.BasePermission):
    """
    Allows access only to the user who placed the order.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class CanManageRestaurantOrder(permissions.BasePermission):
    """
    Allows access only to the Vendor or Staff assigned to the restaurant that owns the order.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False

        if user.role == Role.VENDOR:
            try:
                vendor_profile = user.vendor_profile
                return obj.restaurant.vendor == vendor_profile
            except AttributeError:
                return False

        if user.role == Role.STAFF:
            try:
                staff_profile = user.staff_profile
                # Check that staff belongs to the vendor that owns the restaurant
                return obj.restaurant.vendor == staff_profile.vendor
            except AttributeError:
                return False

        return False
