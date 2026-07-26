from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from api.permissions import IsSuperAdmin, IsCollegeAdmin, IsVendor
from dashboard.utils import parse_time_filter
from accounts.models import VendorProfile, CollegeAdminProfile
from reports.export_csv import generate_vendor_csv, generate_college_csv, generate_platform_csv
from reports.export_excel import generate_vendor_excel, generate_college_excel, generate_platform_excel
from reports.print_report import generate_vendor_print, generate_college_print, generate_platform_print

class BaseReportExportView(APIView):
    def perform_content_negotiation(self, request, force=False):
        from rest_framework.renderers import JSONRenderer
        return (JSONRenderer(), 'application/json')

class VendorReportExportView(BaseReportExportView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor_profile = request.user.vendor_profile
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        export_format = request.query_params.get('format', 'csv').lower()

        if export_format == 'excel':
            return generate_vendor_excel(vendor_profile, start_date, end_date)
        elif export_format == 'print':
            return generate_vendor_print(vendor_profile, start_date, end_date)
        else:
            return generate_vendor_csv(vendor_profile, start_date, end_date)

class CollegeReportExportView(BaseReportExportView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]

    def get(self, request):
        try:
            admin_profile = request.user.college_admin_profile
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "College Admin profile not found"}, status=status.HTTP_404_NOT_FOUND)

        start_date, end_date = parse_time_filter(request)
        export_format = request.query_params.get('format', 'csv').lower()

        if export_format == 'excel':
            return generate_college_excel(admin_profile, start_date, end_date)
        elif export_format == 'print':
            return generate_college_print(admin_profile, start_date, end_date)
        else:
            return generate_college_csv(admin_profile, start_date, end_date)

class PlatformReportExportView(BaseReportExportView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        start_date, end_date = parse_time_filter(request)
        export_format = request.query_params.get('format', 'csv').lower()

        if export_format == 'excel':
            return generate_platform_excel(start_date, end_date)
        elif export_format == 'print':
            return generate_platform_print(start_date, end_date)
        else:
            return generate_platform_csv(start_date, end_date)
