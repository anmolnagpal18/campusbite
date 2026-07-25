from django.db import models
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from api.permissions import IsVendor, IsApprovedUser
from api.views import StandardResultsSetPagination

from accounts.models import Restaurant
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
        queryset = FoodItem.objects.filter(category__restaurant=restaurant).order_by('item_name')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(item_name__icontains=search) | 
                models.Q(description__icontains=search)
            )
            
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
            
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
