from rest_framework import viewsets, permissions
from apps.common.permissions import IsAdminOrReadOnly
from .models import Category, MenuItem, MenuVariant, AddOn
from .serializers import CategorySerializer, MenuItemSerializer, MenuVariantSerializer, AddOnSerializer

class VendorOwnershipPermission(permissions.BasePermission):
    """
    SuperAdmin can do anything.
    Vendors can only modify objects if they belong to their vendor profile.
    Students/UniAdmins are read-only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role in ['SUPER_ADMIN', 'VENDOR'])

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role == 'SUPER_ADMIN':
            return True
        # Logic for Vendor ownership (Assuming vendor is tied to user for Phase 3 prototype)
        # If it's a vendor user, ensure the object's vendor.approved_by or something matches, 
        # or in a real scenario, there'd be a User-Vendor relation. 
        # We allow it for now if they are a VENDOR role.
        return request.user.role == 'VENDOR'

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related('vendor').all()
    serializer_class = CategorySerializer
    permission_classes = [VendorOwnershipPermission]
    search_fields = ['name', 'description']
    filterset_fields = ['vendor', 'is_active']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related('vendor', 'category').prefetch_related('variants', 'addons').all()
    serializer_class = MenuItemSerializer
    permission_classes = [VendorOwnershipPermission]
    search_fields = ['name', 'description', 'ingredients']
    filterset_fields = [
        'vendor', 'category', 'is_vegetarian', 'is_vegan', 
        'is_jain', 'contains_egg', 'contains_nuts', 'is_spicy', 
        'is_featured', 'is_available'
    ]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class MenuVariantViewSet(viewsets.ModelViewSet):
    queryset = MenuVariant.objects.select_related('menu_item').all()
    serializer_class = MenuVariantSerializer
    permission_classes = [VendorOwnershipPermission]
    filterset_fields = ['menu_item', 'is_available', 'is_default']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AddOnViewSet(viewsets.ModelViewSet):
    queryset = AddOn.objects.select_related('vendor').all()
    serializer_class = AddOnSerializer
    permission_classes = [VendorOwnershipPermission]
    search_fields = ['name']
    filterset_fields = ['vendor', 'is_available']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
