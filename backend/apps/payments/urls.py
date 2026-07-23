from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, RazorpayWebhookView

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
    path('', include(router.urls)),
]
