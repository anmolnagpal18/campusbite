from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from .models import Notification

class RealtimePublisher:
    @staticmethod
    def publish_to_user(user_id, event_type, message, reference_type=None, reference_id=None):
        """
        Internal Event Bus standardizer.
        Writes the notification to the database, then broadcasts to the active WebSocket.
        """
        # Create persistent notification
        Notification.objects.create(
            recipient_id=user_id,
            title=event_type,
            message=message,
            reference_type=reference_type,
            reference_id=reference_id
        )
        
        # Broadcast via Redis
        channel_layer = get_channel_layer()
        if channel_layer:
            payload = {
                'type': 'realtime_event', # Must match the consumer method name
                'payload': {
                    'event': event_type,
                    'message': message,
                    'reference_type': reference_type,
                    'reference_id': reference_id,
                    'timestamp': str(timezone.now())
                }
            }
            # Send to group
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}",
                payload
            )
