from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, PreBookingViewSet, QRViewSet, KitchenViewSet

router = DefaultRouter()
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'pre-bookings', PreBookingViewSet, basename='prebooking')
router.register(r'qr', QRViewSet, basename='qr')
router.register(r'kitchen', KitchenViewSet, basename='kitchen')

urlpatterns = [
    path('', include(router.urls)),
]
