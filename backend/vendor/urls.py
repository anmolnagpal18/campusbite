from django.urls import path
from vendor.views import (
    VendorShopDetailView,
    FoodCategoryListCreateView, FoodCategoryRetrieveUpdateDestroyView,
    FoodItemListCreateView, FoodItemRetrieveUpdateDestroyView
)

urlpatterns = [
    path('v1/vendor/shop/', VendorShopDetailView.as_view(), name='vendor-shop-detail'),
    path('v1/vendor/categories/', FoodCategoryListCreateView.as_view(), name='vendor-category-list'),
    path('v1/vendor/categories/<int:pk>/', FoodCategoryRetrieveUpdateDestroyView.as_view(), name='vendor-category-detail'),
    path('v1/vendor/items/', FoodItemListCreateView.as_view(), name='vendor-item-list'),
    path('v1/vendor/items/<int:pk>/', FoodItemRetrieveUpdateDestroyView.as_view(), name='vendor-item-detail'),
]
