import json
import logging
import os
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from bots.whatsapp_bot.handlers import handle_whatsapp_message

logger = logging.getLogger(__name__)

class WhatsAppWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """
        Meta Cloud Webhook Verification Handler
        """
        verify_token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')
        mode = request.GET.get('hub.mode')
        
        expected_token = os.environ.get('WHATSAPP_VERIFY_TOKEN', 'campusbite123')

        if mode == 'subscribe' and verify_token == expected_token:
            logger.info("WhatsApp webhook verified successfully.")
            return HttpResponse(challenge, content_type="text/plain")
        logger.warning("WhatsApp webhook verification token mismatch.")
        return HttpResponse("Verification token mismatch", status=403)

    @method_decorator(csrf_exempt)
    def post(self, request):
        """
        Meta Webhook Message Events Handler
        """
        try:
            body = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"status": "invalid json"}, status=400)

        entry = body.get('entry', [])
        for ent in entry:
            changes = ent.get('changes', [])
            for change in changes:
                val = change.get('value', {})
                messages = val.get('messages', [])
                for msg in messages:
                    sender = msg.get('from')
                    msg_type = msg.get('type')
                    
                    message_text = ""
                    button_id = None
                    
                    if msg_type == 'text':
                        message_text = msg.get('text', {}).get('body', '')
                    elif msg_type == 'interactive':
                        interactive = msg.get('interactive', {})
                        interactive_type = interactive.get('type')
                        if interactive_type == 'button_reply':
                            button_id = interactive.get('button_reply', {}).get('id')
                            message_text = interactive.get('button_reply', {}).get('title', '')
                    
                    if sender:
                        try:
                            handle_whatsapp_message(sender, message_text, button_id)
                        except Exception as e:
                            logger.error(f"Error handling WhatsApp message: {e}", exc_info=True)

        return JsonResponse({"status": "ok"})
