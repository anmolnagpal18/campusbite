from django.contrib.auth import authenticate
from accounts.models import User, BotSession
from bots.state_manager import BotStates

def check_session_auth(session):
    """
    Returns True if the session has a linked user and user is active.
    """
    if session.user and session.user.is_active:
        # Double check matching chat/phone values
        if session.platform == 'TELEGRAM' and session.user.telegram_linked:
            return True
        if session.platform == 'WHATSAPP' and session.user.whatsapp_linked:
            return True
    return False

def link_by_credentials(session, email, password):
    """
    Tries to link user by checking email and password.
    Returns (True, msg) or (False, error).
    """
    user = authenticate(email=email, password=password)
    if user is None:
        return False, "Invalid email or password. Please try again."

    if not user.is_active:
        return False, "This user account is deactivated."

    if session.platform == 'TELEGRAM':
        # Check if already linked to someone else
        existing = User.objects.filter(telegram_chat_id=session.session_id).first()
        if existing and existing != user:
            return False, "This Telegram account is already linked to another email."
        
        user.telegram_chat_id = session.session_id
        user.telegram_linked = True
        user.save()
    else:
        # WHATSAPP
        existing = User.objects.filter(whatsapp_number=session.session_id).first()
        if existing and existing != user:
            return False, "This WhatsApp number is already linked to another email."
        
        user.whatsapp_number = session.session_id
        user.whatsapp_linked = True
        user.save()

    session.user = user
    session.state = BotStates.MAIN_MENU
    session.save()
    return True, f"Success! Your account ({user.email}) has been securely linked."

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

class LinkTelegramView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        chat_id = request.data.get("telegram_chat_id")
        username = request.data.get("telegram_username", "")
        if not chat_id:
            return Response({"detail": "telegram_chat_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        user.telegram_chat_id = chat_id
        user.telegram_username = username
        user.telegram_linked = True
        user.save()
        return Response({"detail": "Telegram account linked successfully."})

class UnlinkTelegramView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        user = request.user
        user.telegram_linked = False
        user.telegram_chat_id = None
        user.telegram_username = None
        user.save()
        BotSession.objects.filter(user=user, platform='TELEGRAM').delete()
        return Response({"detail": "Telegram account unlinked successfully."})

class LinkWhatsAppView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        phone = request.data.get("whatsapp_number")
        if not phone:
            return Response({"detail": "whatsapp_number is required."}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        user.whatsapp_number = phone
        user.whatsapp_linked = True
        user.save()
        return Response({"detail": "WhatsApp account linked successfully."})

class UnlinkWhatsAppView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        user = request.user
        user.whatsapp_linked = False
        user.whatsapp_number = None
        user.save()
        BotSession.objects.filter(user=user, platform='WHATSAPP').delete()
        return Response({"detail": "WhatsApp account unlinked successfully."})
