import os
import time
import threading
import logging
import requests
from abc import ABC, abstractmethod
from django.utils import timezone
from accounts.models import NotificationDelivery
from ordering.models import Notification

logger = logging.getLogger(__name__)

class BaseNotificationProvider(ABC):
    @abstractmethod
    def send(self, recipient_id, title, message):
        """
        Sends the notification.
        Returns: (success_boolean, provider_message_id, error_message_str, raw_response_dict, is_permanent_error)
        """
        pass


class TelegramNotificationProvider(BaseNotificationProvider):
    def send(self, recipient_id, title, message):
        token = os.environ.get('TELEGRAM_BOT_TOKEN')
        if not token:
            return False, None, "TELEGRAM_BOT_TOKEN missing in environment.", {}, True

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": recipient_id,
            "text": f"🔔 *{title}*\n\n{message}",
            "parse_mode": "Markdown"
        }
        try:
            res = requests.post(url, json=payload, timeout=5)
            res_json = res.json() if res.headers.get('content-type') == 'application/json' else {"raw": res.text}
            
            if res.status_code == 200 and res_json.get("ok"):
                message_id = str(res_json.get("result", {}).get("message_id"))
                return True, message_id, None, res_json, False
            
            # Detect permanent errors (e.g. Chat not found, Bot blocked, etc.)
            description = res_json.get("description", "")
            is_perm = any(keyword in description.lower() for keyword in ["chat not found", "bot was blocked", "user is deactivated"])
            return False, None, description, res_json, is_perm
            
        except Exception as e:
            return False, None, str(e), {}, False


class WhatsAppNotificationProvider(BaseNotificationProvider):
    def send(self, recipient_id, title, message):
        access_token = os.environ.get('WHATSAPP_ACCESS_TOKEN')
        phone_id = os.environ.get('WHATSAPP_PHONE_NUMBER_ID')
        if not access_token or not phone_id:
            return False, None, "WHATSAPP_ACCESS_TOKEN or PHONE_NUMBER_ID missing.", {}, True

        url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": recipient_id,
            "type": "text",
            "text": {
                "body": f"🔔 {title}\n\n{message}"
            }
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=5)
            res_json = res.json()
            if res.status_code in (200, 201) and "messages" in res_json:
                msg_id = res_json["messages"][0].get("id")
                return True, msg_id, None, res_json, False
            
            # Detect WhatsApp specific permanent errors (e.g., invalid phone)
            error_data = res_json.get("error", {})
            error_msg = error_data.get("message", "")
            code = error_data.get("code")
            # 100 = invalid parameter (e.g. phone), 131030 = recipient not in allowed list
            is_perm = code in (100, 131030) or "invalid" in error_msg.lower()
            return False, None, error_msg, res_json, is_perm
            
        except Exception as e:
            return False, None, str(e), {}, False


class NotificationDispatcher:
    PROVIDERS = {
        'TELEGRAM': TelegramNotificationProvider(),
        'WHATSAPP': WhatsAppNotificationProvider()
    }

    @classmethod
    def dispatch(cls, notification, user, title, message):
        """
        Asynchronously schedules notification deliveries in separate background threads.
        """
        # Telegram delivery thread
        if user.telegram_linked and user.telegram_chat_id:
            delivery = NotificationDelivery.objects.create(
                notification=notification,
                channel='TELEGRAM',
                status='PENDING'
            )
            threading.Thread(target=cls._run_delivery_with_retry, args=(delivery.id, user.telegram_chat_id)).start()

        # WhatsApp delivery thread
        if user.whatsapp_linked and user.whatsapp_number:
            delivery = NotificationDelivery.objects.create(
                notification=notification,
                channel='WHATSAPP',
                status='PENDING'
            )
            threading.Thread(target=cls._run_delivery_with_retry, args=(delivery.id, user.whatsapp_number)).start()

    @classmethod
    def _run_delivery_with_retry(cls, delivery_id, recipient_id):
        # Allow retry parameters (up to 3 attempts with exponential backoff)
        max_attempts = 3
        backoff_factor = 2

        for attempt in range(1, max_attempts + 1):
            try:
                # Fetch delivery record
                delivery = NotificationDelivery.objects.get(id=delivery_id)
            except NotificationDelivery.DoesNotExist:
                return

            delivery.attempts = attempt
            delivery.last_attempt = timezone.now()
            delivery.save()

            provider = cls.PROVIDERS.get(delivery.channel)
            if not provider:
                delivery.status = 'FAILED'
                delivery.error_message = "No active provider registered for this channel."
                delivery.save()
                return

            success, provider_msg_id, err, resp_payload, is_perm = provider.send(
                recipient_id,
                delivery.notification.title,
                delivery.notification.message
            )

            delivery.response_payload = resp_payload
            if success:
                delivery.status = 'SENT'
                delivery.provider_message_id = provider_msg_id
                delivery.delivered_at = timezone.now()
                delivery.error_message = None
                delivery.save()
                break
            else:
                delivery.status = 'FAILED'
                delivery.error_message = err
                delivery.save()
                
                # Check for permanent errors (stop retrying immediately)
                if is_perm:
                    logger.warning(f"Aborting retries for {delivery.channel} due to permanent delivery error: {err}")
                    break
                
                # Exponential backoff delay
                if attempt < max_attempts:
                    delay = backoff_factor ** attempt
                    time.sleep(delay)


def send_bot_notification(user, title, message):
    """
    Standard backward-compatibility hook. Routes directly into the pluggable dispatcher.
    """
    # Create system notification instance dynamically if not present
    note = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=Notification.NotificationType.SYSTEM
    )
    NotificationDispatcher.dispatch(note, user, title, message)
