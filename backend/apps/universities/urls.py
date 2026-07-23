from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UniversityViewSet, BuildingViewSet, BlockViewSet

router = DefaultRouter()
router.register(r'universities', UniversityViewSet)
router.register(r'buildings', BuildingViewSet)
router.register(r'blocks', BlockViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
