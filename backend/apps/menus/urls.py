from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MenuItemViewSet, MenuVariantViewSet, AddOnViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')
router.register(r'menu-variants', MenuVariantViewSet, basename='menuvariant')
router.register(r'addons', AddOnViewSet, basename='addon')

urlpatterns = [
    path('', include(router.urls)),
]
