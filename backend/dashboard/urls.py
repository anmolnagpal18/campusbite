from django.urls import path
from dashboard.views import (
    VendorDashboardStatsView, VendorRevenueAnalyticsView, VendorOrdersAnalyticsView,
    CollegeAdminDashboardStatsView, CollegeAdminRestaurantsView, CollegeAdminRevenueView,
    SuperAdminDashboardStatsView, SuperAdminCollegesView, SuperAdminVendorsView
)

urlpatterns = [
    # Vendor Dashboard
    path('vendor/', VendorDashboardStatsView.as_view(), name='vendor-stats'),
    path('vendor/revenue/', VendorRevenueAnalyticsView.as_view(), name='vendor-revenue'),
    path('vendor/orders/', VendorOrdersAnalyticsView.as_view(), name='vendor-orders'),

    # College Admin Dashboard
    path('college-admin/', CollegeAdminDashboardStatsView.as_view(), name='college-admin-stats'),
    path('college-admin/restaurants/', CollegeAdminRestaurantsView.as_view(), name='college-admin-restaurants'),
    path('college-admin/revenue/', CollegeAdminRevenueView.as_view(), name='college-admin-revenue'),

    # Super Admin Dashboard
    path('super-admin/', SuperAdminDashboardStatsView.as_view(), name='super-admin-stats'),
    path('super-admin/colleges/', SuperAdminCollegesView.as_view(), name='super-admin-colleges'),
    path('super-admin/vendors/', SuperAdminVendorsView.as_view(), name='super-admin-vendors'),
]
