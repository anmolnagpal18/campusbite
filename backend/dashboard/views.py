from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from api.permissions import IsSuperAdmin, IsCollegeAdmin, IsVendor
from dashboard.utils import parse_time_filter
from dashboard.services import VendorAnalyticsService, CollegeAnalyticsService, SuperAdminAnalyticsService
from accounts.models import CollegeAdminProfile, VendorProfile, Restaurant

# -----------------
# VENDOR DASHBOARD
# -----------------

class VendorDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor_profile = request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        data = VendorAnalyticsService.get_analytics(vendor_profile, start_date, end_date)
        return Response(data)

class VendorRevenueAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor_profile = request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        data = VendorAnalyticsService.get_analytics(vendor_profile, start_date, end_date)
        return Response(data.get("charts", {}).get("revenue", []))

class VendorOrdersAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor_profile = request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        data = VendorAnalyticsService.get_analytics(vendor_profile, start_date, end_date)
        return Response({
            "status_distribution": data.get("charts", {}).get("orders_status", []),
            "top_selling_foods": data.get("charts", {}).get("top_selling", []),
            "low_stock_items": data.get("tables", {}).get("low_stock_items", [])
        })

# ----------------------
# COLLEGE ADMIN DASHBOARD
# ----------------------

class CollegeAdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]

    def get(self, request):
        try:
            admin_profile = request.user.college_admin_profile
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "College Admin profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        data = CollegeAnalyticsService.get_analytics(admin_profile, start_date, end_date)
        return Response(data)

class CollegeAdminRestaurantsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]

    def get(self, request):
        try:
            admin_profile = request.user.college_admin_profile
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "College Admin profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        data = CollegeAnalyticsService.get_analytics(admin_profile, start_date, end_date)
        return Response(data.get("tables", {}).get("restaurants", []))

class CollegeAdminRevenueView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]

    def get(self, request):
        try:
            admin_profile = request.user.college_admin_profile
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "College Admin profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        data = CollegeAnalyticsService.get_analytics(admin_profile, start_date, end_date)
        return Response({
            "revenue_series": data.get("charts", {}).get("revenue", []),
            "orders_series": data.get("charts", {}).get("orders", []),
            "vendor_share": data.get("charts", {}).get("vendor_share", [])
        })

# ----------------------
# SUPER ADMIN DASHBOARD
# ----------------------

class SuperAdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        start_date, end_date = parse_time_filter(request)
        data = SuperAdminAnalyticsService.get_analytics(start_date, end_date)
        return Response(data)

class SuperAdminCollegesView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        start_date, end_date = parse_time_filter(request)
        data = SuperAdminAnalyticsService.get_analytics(start_date, end_date)
        return Response(data.get("tables", {}).get("colleges", []))

class SuperAdminVendorsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        # Return summary of restaurants and active stats
        start_date, end_date = parse_time_filter(request)
        data = SuperAdminAnalyticsService.get_analytics(start_date, end_date)
        
        # Pull extra details for vendor list
        restaurants = list(Restaurant.objects.all().select_related('vendor', 'vendor__user', 'vendor__college').values(
            'id', 'restaurant_name', 'vendor__user__email', 'vendor__college__college_name', 'status', 'accepting_orders'
        ))
        return Response({
            "overview": data.get("summary", {}),
            "restaurants": restaurants
        })
