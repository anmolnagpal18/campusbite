from rest_framework import serializers
from django.contrib.auth import get_user_model
from chat.models import Conversation, ConversationParticipant, Message

User = get_user_model()

class ParticipantUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'first_name', 'last_name']

class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = ParticipantUserSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ['user']

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_email', 'sender_role', 'content', 'read_at', 'created_at']
        read_only_fields = ['sender']

class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'created_at', 'updated_at', 'participants', 'last_message', 'unread_count']

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if msg:
            return {
                "id": msg.id,
                "content": msg.content,
                "created_at": msg.created_at,
                "sender_email": msg.sender.email,
                "sender_role": msg.sender.role
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(
                is_deleted=False,
                read_at__isnull=True
            ).exclude(sender=request.user).count()
        return 0
