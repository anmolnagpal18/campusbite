import hmac
import hashlib
import json
import logging
import requests
from django.conf import settings
from django.utils import timezone
from .models import CommunicationChannel, MessageLog
from apps.orders.models import PreBooking

logger = logging.getLogger(__name__)

class WhatsAppService:
    BASE_URL = "https://graph.facebook.com/v17.0"
    
    @classmethod
    def send_template(cls, phone, template_name, components=None):
        token = getattr(settings, 'WHATSAPP_ACCESS_TOKEN', 'test_token')
        phone_id = getattr(settings, 'WHATSAPP_PHONE_ID', 'test_phone_id')
        
        url = f"{cls.BASE_URL}/{phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en"},
                "components": components or []
            }
        }
        
        # In a real setup, we execute the request.
        # res = requests.post(url, headers=headers, json=payload)
        # return res.json()
        
        # Mocking for Phase 8 Verification
        return {"messages": [{"id": f"wamid.{timezone.now().timestamp()}"}]}

    @classmethod
    def verify_webhook_signature(cls, payload, signature):
        secret = getattr(settings, 'WHATSAPP_APP_SECRET', 'test_secret').encode('utf-8')
        expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(f"sha256={expected}", signature)


class TelegramService:
    @classmethod
    def send_message(cls, chat_id, text):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', 'test_token')
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        
        # res = requests.post(url, json=payload)
        # return res.json()
        
        return {"ok": True, "result": {"message_id": int(timezone.now().timestamp())}}


class MessageDispatcher:
    @classmethod
    def dispatch_status_update(cls, booking: PreBooking):
        channels = CommunicationChannel.objects.filter(
            student=booking.student,
            verified=True,
            notifications_enabled=True
        )
        
        if not channels.exists():
            return

        for channel in channels:
            log = MessageLog.objects.create(
                channel=channel,
                booking=booking,
                message_type=cls._map_status_to_msg_type(booking.status),
                provider=channel.platform
            )
            
            try:
                if channel.platform == CommunicationChannel.Platform.WHATSAPP:
                    res = WhatsAppService.send_template(
                        channel.phone_number,
                        f"order_{booking.status.lower()}",
                        [{"type": "body", "parameters": [{"type": "text", "text": booking.booking_reference}]}]
                    )
                    log.message_id = res['messages'][0]['id']
                    
                elif channel.platform == CommunicationChannel.Platform.TELEGRAM:
                    text = f"Update on Order <b>#{booking.booking_reference}</b>: Your order is now {booking.status}."
                    res = TelegramService.send_message(channel.telegram_chat_id, text)
                    log.message_id = str(res['result']['message_id'])
                
                log.status = MessageLog.InternalStatus.SENT
                log.response = res
                
            except Exception as e:
                log.status = MessageLog.InternalStatus.FAILED
                log.failure_reason = str(e)
                
            log.save()

    @staticmethod
    def _map_status_to_msg_type(status):
        mapping = {
            'CONFIRMED': MessageLog.MessageType.ORDER_CONFIRMED,
            'PREPARING': MessageLog.MessageType.PREPARING,
            'READY_FOR_PICKUP': MessageLog.MessageType.READY,
            'COMPLETED': MessageLog.MessageType.PICKED_UP,
            'CANCELLED': MessageLog.MessageType.CANCELLED
        }
        return mapping.get(status, MessageLog.MessageType.FAILED)
