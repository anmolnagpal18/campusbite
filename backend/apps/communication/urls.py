from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommunicationChannelViewSet, WhatsAppWebhookView

router = DefaultRouter()
router.register(r'channels', CommunicationChannelViewSet, basename='channel')

urlpatterns = [
    path('webhook/whatsapp/', WhatsAppWebhookView.as_view(), name='whatsapp-webhook'),
    path('', include(router.urls)),
]
