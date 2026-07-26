from django.urls import path
from bots.whatsapp_bot.webhook import WhatsAppWebhookView

from bots.auth import LinkTelegramView, UnlinkTelegramView, LinkWhatsAppView, UnlinkWhatsAppView

urlpatterns = [
    path('whatsapp/webhook/', WhatsAppWebhookView.as_view(), name='whatsapp_webhook'),
    path('auth/link-telegram/', LinkTelegramView.as_view(), name='link_telegram'),
    path('auth/unlink-telegram/', UnlinkTelegramView.as_view(), name='unlink_telegram'),
    path('auth/link-whatsapp/', LinkWhatsAppView.as_view(), name='link_whatsapp'),
    path('auth/unlink-whatsapp/', UnlinkWhatsAppView.as_view(), name='unlink_whatsapp'),
]
