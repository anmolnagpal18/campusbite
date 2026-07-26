from django.db import models, transaction
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from chat.models import Conversation, ConversationParticipant, Message
from chat.serializers import ConversationSerializer, MessageSerializer
from core.enums import Role
from accounts.models import CollegeAdminProfile, VendorProfile, StaffProfile

User = get_user_model()

def validate_chat_relationship(user1, user2):
    """
    Enforces the messaging restriction rules:
    - Super Admin <-> College Admin
    - College Admin <-> Vendor (within same college)
    - Vendor <-> Staff (staff belongs to vendor)
    """
    if not user1.is_active or not user2.is_active:
        return False, "One of the participants is inactive."

    role1, role2 = user1.role, user2.role
    
    # Order roles so we don't have to duplicate comparisons
    r_pair = sorted([role1, role2])
    
    # 1. Super Admin <-> College Admin
    if r_pair == sorted([Role.SUPER_ADMIN, Role.COLLEGE_ADMIN]):
        return True, ""
        
    # 2. College Admin <-> Vendor (within same college)
    if r_pair == sorted([Role.COLLEGE_ADMIN, Role.VENDOR]):
        # Find college admin and vendor
        c_admin = user1 if role1 == Role.COLLEGE_ADMIN else user2
        vendor = user1 if role1 == Role.VENDOR else user2
        try:
            ca_profile = c_admin.college_admin_profile
            v_profile = vendor.vendor_profile
            if ca_profile.college == v_profile.college:
                return True, ""
            return False, "College Admin can only message Vendors in their own college."
        except Exception:
            return False, "Profiles not found for relationship validation."

    # 3. Vendor <-> Staff (staff links to vendor)
    if r_pair == sorted([Role.VENDOR, Role.STAFF]):
        vendor = user1 if role1 == Role.VENDOR else user2
        staff = user1 if role1 == Role.STAFF else user2
        try:
            v_profile = vendor.vendor_profile
            s_profile = staff.staff_profile
            if s_profile.vendor == v_profile:
                return True, ""
            return False, "Vendor can only message their own linked Staff."
        except Exception:
            return False, "Profiles not found for relationship validation."

    return False, "Direct communication between these roles is not permitted."


class ConversationListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Find all conversations where request.user is a participant
        conversations = Conversation.objects.filter(
            is_deleted=False,
            participants__user=user
        ).distinct()

        # Handle Search
        q = request.query_params.get('q', '')
        if q:
            conversations = conversations.filter(
                models.Q(participants__user__email__icontains=q) |
                models.Q(participants__user__first_name__icontains=q) |
                models.Q(participants__user__last_name__icontains=q) |
                models.Q(messages__content__icontains=q)
            ).distinct()

        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        if not receiver_id:
            return Response({"detail": "receiver_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = User.objects.get(pk=receiver_id)
        except User.DoesNotExist:
            return Response({"detail": "Receiver not found."}, status=status.HTTP_404_NOT_FOUND)

        if receiver == request.user:
            return Response({"detail": "Cannot start a conversation with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce relationship check
        allowed, err_msg = validate_chat_relationship(request.user, receiver)
        if not allowed:
            return Response({"detail": err_msg}, status=status.HTTP_403_FORBIDDEN)

        # Check if conversation already exists between these 2 users
        conv_qs = Conversation.objects.filter(
            is_deleted=False,
            participants__user=request.user
        ).filter(
            participants__user=receiver
        )

        if conv_qs.exists():
            conversation = conv_qs.first()
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data)

        # Create new conversation
        with transaction.atomic():
            conversation = Conversation.objects.create()
            ConversationParticipant.objects.create(conversation=conversation, user=request.user)
            ConversationParticipant.objects.create(conversation=conversation, user=receiver)

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(pk=conversation_id, is_deleted=False)
        except Conversation.DoesNotExist:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check permission
        if not conversation.participants.filter(user=request.user).exists():
            return Response({"detail": "Not a participant in this conversation."}, status=status.HTTP_403_FORBIDDEN)

        # Mark all messages in this conversation from others as read
        conversation.messages.filter(
            is_deleted=False,
            read_at__isnull=True
        ).exclude(sender=request.user).update(read_at=timezone.now())

        messages = conversation.messages.filter(is_deleted=False).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        content = request.data.get('content')

        if not conversation_id or not content:
            return Response({"detail": "conversation_id and content are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            conversation = Conversation.objects.get(pk=conversation_id, is_deleted=False)
        except Conversation.DoesNotExist:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check permission
        if not conversation.participants.filter(user=request.user).exists():
            return Response({"detail": "Not a participant in this conversation."}, status=status.HTTP_403_FORBIDDEN)

        # Create message
        with transaction.atomic():
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=content
            )
            # Update conversation timestamp to float to top in list
            conversation.updated_at = timezone.now()
            conversation.save()

        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageReadActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            message = Message.objects.get(pk=pk, is_deleted=False)
        except Message.DoesNotExist:
            return Response({"detail": "Message not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if conversation participant
        if not message.conversation.participants.filter(user=request.user).exists():
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if message.sender == request.user:
            return Response({"detail": "Cannot mark own message as read."}, status=status.HTTP_400_BAD_REQUEST)

        message.read_at = timezone.now()
        message.save()
        return Response({"success": True, "message": "Message marked as read."})
