from django.db import models, transaction
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from api.permissions import IsVendor, IsApprovedUser
from api.views import StandardResultsSetPagination

from accounts.models import Restaurant, ApprovalLog
from vendor.models import FoodCategory, FoodItem
from vendor.serializers import RestaurantSerializer, FoodCategorySerializer, FoodItemSerializer

class VendorShopDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor, IsApprovedUser]
    
    def get(self, request):
        restaurant = request.user.vendor_profile.restaurant
        serializer = RestaurantSerializer(restaurant)
        return Response(serializer.data)

    def put(self, request):
        restaurant = request.user.vendor_profile.restaurant
        serializer = RestaurantSerializer(restaurant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FoodCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = FoodCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor, IsApprovedUser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        restaurant = self.request.user.vendor_profile.restaurant
        queryset = FoodCategory.objects.filter(restaurant=restaurant).order_by('display_order', 'category_name')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(category_name__icontains=search)
        return queryset

    def perform_create(self, serializer):
        restaurant = self.request.user.vendor_profile.restaurant
        serializer.save(restaurant=restaurant)

class FoodCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor, IsApprovedUser]

    def get_queryset(self):
        restaurant = self.request.user.vendor_profile.restaurant
        return FoodCategory.objects.filter(restaurant=restaurant)

    def perform_destroy(self, instance):
        # Soft delete category's items before soft deleting the category
        instance.items.all().update(is_deleted=True, deleted_at=timezone.now())
        instance.delete()

class FoodItemListCreateView(generics.ListCreateAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor, IsApprovedUser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        restaurant = self.request.user.vendor_profile.restaurant
        queryset = FoodItem.objects.filter(category__restaurant=restaurant).order_by('display_order', 'item_name')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(item_name__icontains=search) | 
                models.Q(description__icontains=search)
            )
            
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        availability = self.request.query_params.get('availability')
        if availability:
            queryset = queryset.filter(availability=availability)
            
        return queryset

    def perform_create(self, serializer):
        category = serializer.validated_data.get('category')
        restaurant = self.request.user.vendor_profile.restaurant
        if category.restaurant != restaurant:
            raise serializers.ValidationError({"category": "Selected category does not belong to your restaurant."})
        serializer.save()

class FoodItemRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor, IsApprovedUser]

    def get_queryset(self):
        restaurant = self.request.user.vendor_profile.restaurant
        return FoodItem.objects.filter(category__restaurant=restaurant)

class FoodItemBulkActionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor, IsApprovedUser]

    def post(self, request):
        action = request.data.get('action')
        item_ids = request.data.get('item_ids', [])

        if not action or not item_ids:
            return Response({"detail": "Action and item_ids are required fields."}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = request.user.vendor_profile.restaurant
        items = FoodItem.objects.filter(id__in=item_ids, category__restaurant=restaurant)

        if items.count() != len(item_ids):
            return Response({"detail": "Some items could not be found or you do not have permission to modify them."}, status=status.HTTP_400_BAD_REQUEST)

        remarks = ""
        with transaction.atomic():
            if action == 'delete':
                items.update(is_deleted=True, deleted_at=timezone.now())
                remarks = f"Vendor hidden/deleted {len(item_ids)} food items."
            
            elif action == 'change_availability':
                availability = request.data.get('availability')
                if not availability:
                    return Response({"detail": "availability value is required for this action."}, status=status.HTTP_400_BAD_REQUEST)
                items.update(availability=availability)
                remarks = f"Vendor updated availability to '{availability}' for {len(item_ids)} items."
            
            elif action == 'move_category':
                category_id = request.data.get('category_id')
                if not category_id:
                    return Response({"detail": "category_id value is required for this action."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    category = FoodCategory.objects.get(id=category_id, restaurant=restaurant)
                except FoodCategory.DoesNotExist:
                    return Response({"detail": "Selected category does not exist or you do not own it."}, status=status.HTTP_400_BAD_REQUEST)
                
                items.update(category=category)
                remarks = f"Vendor moved {len(item_ids)} items to category '{category.category_name}'."
            
            else:
                return Response({"detail": "Invalid action specified."}, status=status.HTTP_400_BAD_REQUEST)

            # Audit logging
            ApprovalLog.objects.create(
                user=request.user,
                role=request.user.role,
                action="BULK_UPDATE",
                remarks=remarks
            )

        return Response({"success": True, "message": "Bulk action executed successfully."})

class FoodItemReorderView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor, IsApprovedUser]

    def post(self, request):
        mappings = request.data
        if not isinstance(mappings, list):
            return Response({"detail": "Expected list of objects with 'id' and 'display_order'."}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = request.user.vendor_profile.restaurant

        with transaction.atomic():
            for mapping in mappings:
                item_id = mapping.get('id')
                display_order = mapping.get('display_order')
                if item_id is not None and display_order is not None:
                    FoodItem.objects.filter(id=item_id, category__restaurant=restaurant).update(display_order=display_order)

            # Audit logging
            ApprovalLog.objects.create(
                user=request.user,
                role=request.user.role,
                action="REORDER",
                remarks="Vendor reordered menu items."
            )

        return Response({"success": True, "message": "Display order updated successfully."})
