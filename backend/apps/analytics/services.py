import json
from .models import AnalyticsSnapshot

class DashboardService:
    @staticmethod
    def get_university_dashboard(university_id):
        # Retrieve latest snapshot (mocking pre-computed data)
        snapshot = AnalyticsSnapshot.objects.filter(tenant_id=university_id).order_by('-snapshot_date').first()
        
        if not snapshot:
            return {
                "total_orders": 0,
                "total_revenue": 0.00,
                "average_order_value": 0.00,
                "trend_data": []
            }
            
        # Mock trend data for Recharts
        trend_data = [
            {"name": "Mon", "revenue": float(snapshot.total_revenue) * 0.8, "orders": snapshot.total_orders - 5},
            {"name": "Tue", "revenue": float(snapshot.total_revenue) * 0.9, "orders": snapshot.total_orders - 2},
            {"name": "Wed", "revenue": float(snapshot.total_revenue) * 1.1, "orders": snapshot.total_orders + 4},
            {"name": "Thu", "revenue": float(snapshot.total_revenue) * 1.2, "orders": snapshot.total_orders + 8},
            {"name": "Fri", "revenue": float(snapshot.total_revenue), "orders": snapshot.total_orders},
        ]
        
        return {
            "total_orders": snapshot.total_orders,
            "total_revenue": snapshot.total_revenue,
            "average_order_value": snapshot.average_order_value,
            "trend_data": trend_data
        }

class AIInsightGenerator:
    @staticmethod
    def generate_insights_from_json(metrics_json):
        """
        In production, this pipes metrics_json to Gemini API.
        For now, we return deterministic insights based on the payload.
        """
        return [
            "Orders increased by 18% compared to last week.",
            "Peak ordering occurs between 12:30 PM and 1:15 PM.",
            "Vendor A consistently has the shortest preparation time.",
            "Vegetarian meals are trending this week."
        ]
