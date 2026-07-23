import json
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .models import CommunicationChannel, MessageLog
from .serializers import CommunicationChannelSerializer, MessageLogSerializer
from .services import WhatsAppService

class CommunicationChannelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommunicationChannelSerializer

    def get_queryset(self):
        return CommunicationChannel.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'], url_path='verify')
    def verify_channel(self, request, pk=None):
        channel = self.get_object()
        # In production, send OTP via WhatsApp or detect /start on Telegram.
        # Mocking verification success.
        channel.verified = True
        channel.last_verified_at = timezone.now()
        channel.save()
        return Response({"message": f"{channel.platform} channel verified!"})

class WhatsAppWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Meta Challenge Verification
        verify_token = "my_custom_verify_token"
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')

        if mode == 'subscribe' and token == verify_token:
            return Response(int(challenge), status=status.HTTP_200_OK)
        return Response(status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        signature = request.headers.get('X-Hub-Signature-256', '')
        if not WhatsAppService.verify_webhook_signature(request.body, signature):
            return Response({"error": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)

        payload = request.data
        try:
            for entry in payload.get('entry', []):
                for change in entry.get('changes', []):
                    value = change.get('value', {})
                    if 'statuses' in value:
                        for ws_status in value['statuses']:
                            msg_id = ws_status.get('id')
                            status_str = ws_status.get('status') # sent, delivered, read, failed
                            
                            try:
                                log = MessageLog.objects.get(message_id=msg_id)
                                log.provider_status = status_str
                                
                                if status_str == 'delivered':
                                    log.status = MessageLog.InternalStatus.DELIVERED
                                    log.delivered_at = timezone.now()
                                elif status_str == 'read':
                                    log.read_at = timezone.now()
                                elif status_str == 'failed':
                                    log.status = MessageLog.InternalStatus.FAILED
                                    log.failure_reason = json.dumps(ws_status.get('errors', []))
                                
                                log.save()
                            except MessageLog.DoesNotExist:
                                pass
        except Exception:
            pass
            
        return Response(status=status.HTTP_200_OK)
