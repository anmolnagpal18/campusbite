import os
import requests
import logging

logger = logging.getLogger(__name__)

def send_whatsapp_payload(payload):
    """
    Dispatches outbound WhatsApp API request to Meta's servers.
    """
    access_token = os.environ.get('WHATSAPP_ACCESS_TOKEN')
    phone_id = os.environ.get('WHATSAPP_PHONE_NUMBER_ID')
    
    if not access_token or not phone_id:
        logger.warning("WhatsApp API credentials missing in environment. Mocking output print:")
        print(f"[MOCK WHATSAPP OUTBOUND]: {payload}")
        return True

    url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=5)
        if res.status_code not in (200, 201):
            logger.error(f"WhatsApp HTTP error: {res.text}")
            return False
        return True
    except Exception as e:
        logger.error(f"WhatsApp API request failed: {e}")
        return False
