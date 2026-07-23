from django.urls import path
from .views import LivenessProbeView, ReadinessProbeView

urlpatterns = [
    path('live/', LivenessProbeView.as_view(), name='health-live'),
    path('ready/', ReadinessProbeView.as_view(), name='health-ready'),
]
