import logging
import json
from django.conf import settings
from .models import Conversation, ConversationMessage, RecommendationLog
from apps.orders.models import PreBooking
from apps.menus.models import MenuItem

logger = logging.getLogger(__name__)

class ContextTools:
    @staticmethod
    def get_active_orders(student_id):
        orders = PreBooking.objects.filter(
            student_id=student_id,
            status__in=['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP']
        ).values('booking_reference', 'status', 'queue_position', 'estimated_ready_at')
        return json.dumps(list(orders), default=str)

    @staticmethod
    def search_menu(query, is_veg=None):
        qs = MenuItem.objects.filter(is_active=True, name__icontains=query)
        if is_veg is not None:
            qs = qs.filter(is_vegetarian=is_veg)
        
        items = qs[:5].values('id', 'name', 'base_price', 'preparation_time', 'vendor__name')
        return json.dumps(list(items), default=str)

class AIGateway:
    """
    Mock integration for Google Gemini.
    In production, this would initialize ChatGoogleGenerativeAI from langchain_google_genai
    and pass tools like ContextTools to it.
    """
    @classmethod
    def generate_chat_response(cls, student, session_id, user_message):
        # 1. Fetch/Create Conversation
        conv, _ = Conversation.objects.get_or_create(session_id=session_id, defaults={'student': student})
        
        # 2. Log User Message
        ConversationMessage.objects.create(
            conversation=conv, role=ConversationMessage.RoleChoices.USER, content=user_message, token_count=len(user_message.split())
        )
        
        # 3. Intent Detection & RAG (Simplified Mock)
        context = ""
        if "order" in user_message.lower():
            context = ContextTools.get_active_orders(student.id)
        elif "food" in user_message.lower() or "menu" in user_message.lower():
            context = ContextTools.search_menu(user_message.replace("food", "").strip())
            
        # 4. LLM Execution (Mock)
        # prompt = f"Context: {context}\nUser: {user_message}"
        # llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=settings.GEMINI_API_KEY)
        # response = llm.invoke(prompt)
        ai_response_text = f"I am your CampusBite Assistant. Based on your request, here is the information: {context if context else 'How can I help you with your meals today?'}"
        
        # 5. Log Assistant Message
        msg = ConversationMessage.objects.create(
            conversation=conv, role=ConversationMessage.RoleChoices.ASSISTANT, content=ai_response_text, token_count=len(ai_response_text.split()), latency=150.0
        )
        
        return ai_response_text
