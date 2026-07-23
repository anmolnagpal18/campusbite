from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, PreBookingViewSet

router = DefaultRouter()
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'pre-bookings', PreBookingViewSet, basename='prebooking')

urlpatterns = [
    path('', include(router.urls)),
]
