from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .services import DashboardService, AIInsightGenerator

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def university(self, request):
        # RBAC constraint: Ensure user belongs to this university
        university_id = request.user.university_id if hasattr(request.user, 'university_id') else None
        
        data = DashboardService.get_university_dashboard(university_id)
        return Response(data)

    @action(detail=False, methods=['get'])
    def insights(self, request):
        university_id = request.user.university_id if hasattr(request.user, 'university_id') else None
        data = DashboardService.get_university_dashboard(university_id)
        
        insights = AIInsightGenerator.generate_insights_from_json(data)
        return Response({"insights": insights})
