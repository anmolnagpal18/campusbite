from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
import uuid

class PromptTemplate(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    content = models.TextField(help_text="The system prompt template string.")
    version = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.name} v{self.version}"

class Conversation(BaseModel):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    session_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=255, default="New Conversation")

    def __str__(self):
        return f"Conversation {self.session_id} - {self.student.email}"

class ConversationMessage(BaseModel):
    class RoleChoices(models.TextChoices):
        USER = 'USER', 'User'
        ASSISTANT = 'ASSISTANT', 'Assistant'
        SYSTEM = 'SYSTEM', 'System'

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=RoleChoices.choices)
    content = models.TextField()
    token_count = models.IntegerField(default=0)
    latency = models.FloatField(default=0.0, help_text="Latency in ms")

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role} in {self.conversation.session_id}"

class RecommendationLog(BaseModel):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recommendations')
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, null=True, blank=True)
    
    recommended_items = models.JSONField(default=list, help_text="List of menu item IDs")
    reason = models.TextField()
    confidence_score = models.FloatField(default=0.0)
    accepted = models.BooleanField(default=False)
    
    provider = models.CharField(max_length=50, default="google-gemini")
    model_name = models.CharField(max_length=100, default="gemini-2.5-flash")
    token_usage = models.IntegerField(default=0)
    latency = models.FloatField(default=0.0)
    user_feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Recommendation for {self.student.email}"
