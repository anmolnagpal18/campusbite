from django.urls import path
from reports.views import VendorReportExportView, CollegeReportExportView, PlatformReportExportView

urlpatterns = [
    path('vendor/daily/', VendorReportExportView.as_view(), name='report-vendor-daily'),
    path('college/monthly/', CollegeReportExportView.as_view(), name='report-college-monthly'),
    path('platform/', PlatformReportExportView.as_view(), name='report-platform'),
]
