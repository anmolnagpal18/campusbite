from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIChatViewSet

router = DefaultRouter()
router.register(r'', AIChatViewSet, basename='ai-chat')

urlpatterns = [
    path('', include(router.urls)),
]
