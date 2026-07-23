from channels.generic.websocket import AsyncJsonWebsocketConsumer
import logging

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        
        # We rely on JWTAuthMiddleware (or similar) to populate self.user
        # If Anonymous, reject
        if self.user and self.user.is_authenticated:
            self.group_name = f"user_{self.user.id}"
            
            # Join room group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from WebSocket (if client sends data)
    async def receive_json(self, content):
        pass # Currently one-way server-to-client

    # Receive message from room group (Event Bus)
    async def realtime_event(self, event):
        payload = event['payload']
        # Send message to WebSocket
        await self.send_json(payload)
