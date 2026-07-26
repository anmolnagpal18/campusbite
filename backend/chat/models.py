from django.db import models
from django.contrib.auth import get_user_model
from core.mixins import TimestampedSoftDeletedModel

User = get_user_model()

class Conversation(TimestampedSoftDeletedModel):
    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        participants = ", ".join([p.user.email for p in self.participants.all()])
        return f"Conversation ({participants})"

class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_participations')

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f"{self.user.email} in {self.conversation}"

class Message(TimestampedSoftDeletedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender.email} in {self.conversation.id} at {self.created_at}"
