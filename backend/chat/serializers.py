from rest_framework import serializers
from django.contrib.auth import get_user_model
from chat.models import Conversation, ConversationParticipant, Message
import os
import mimetypes

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
        fields = [
            'id', 'conversation', 'sender', 'sender_email', 'sender_role', 
            'content', 'read_at', 'created_at',
            'attachment', 'attachment_name', 'attachment_type', 'attachment_size'
        ]
        read_only_fields = ['sender', 'attachment_name', 'attachment_type', 'attachment_size']

    def validate_content(self, value):
        if value:
            value = value.strip()
        if not value:
            raise serializers.ValidationError("Message content cannot be empty.")
        if len(value) > 1000:
            raise serializers.ValidationError("Message content cannot exceed 1000 characters.")
        return value

    def validate(self, data):
        attachment = data.get('attachment')
        if attachment:
            # Enforce 10 MB limit
            if attachment.size > 10 * 1024 * 1024:
                raise serializers.ValidationError({"attachment": "File size cannot exceed 10 MB."})
            
            # File extension validation
            valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']
            ext = os.path.splitext(attachment.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError({"attachment": "Unsupported file type. Only PDF and images (JPG, JPEG, PNG, WebP) are allowed."})
        return data

    def create(self, validated_data):
        attachment = validated_data.get('attachment')
        if attachment:
            validated_data['attachment_name'] = attachment.name
            validated_data['attachment_size'] = attachment.size
            mime_type, _ = mimetypes.guess_type(attachment.name)
            validated_data['attachment_type'] = mime_type or 'application/octet-stream'
        return super().create(validated_data)

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
