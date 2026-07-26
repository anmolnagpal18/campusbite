from django.urls import path
from chat.views import (
    ConversationListCreateView, MessageListCreateView, MessageReadActionView,
    UnreadMessagesCountView
)

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversations-list-create'),
    path('unread-count/', UnreadMessagesCountView.as_view(), name='unread-count'),
    path('messages/<int:conversation_id>/', MessageListCreateView.as_view(), name='messages-list'),
    path('messages/', MessageListCreateView.as_view(), name='message-create'),
    path('messages/<int:pk>/read/', MessageReadActionView.as_view(), name='message-read'),
]
