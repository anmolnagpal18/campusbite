from rest_framework import serializers
from .models import CommunicationChannel, MessageLog

class CommunicationChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationChannel
        fields = ['id', 'platform', 'phone_number', 'telegram_chat_id', 'verified', 'notifications_enabled', 'last_verified_at']
        read_only_fields = ['id', 'verified', 'last_verified_at']

class MessageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageLog
        fields = '__all__'
