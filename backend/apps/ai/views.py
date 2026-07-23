from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .services import AIGateway
from .models import Conversation, ConversationMessage
import uuid

class AIChatViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='chat')
    def chat(self, request):
        user_message = request.data.get('message')
        session_id_str = request.data.get('session_id')
        
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            session_id = uuid.UUID(session_id_str) if session_id_str else uuid.uuid4()
        except ValueError:
            session_id = uuid.uuid4()
            
        response_text = AIGateway.generate_chat_response(request.user, session_id, user_message)
        
        return Response({
            "session_id": str(session_id),
            "response": response_text
        }, status=status.HTTP_200_OK)
