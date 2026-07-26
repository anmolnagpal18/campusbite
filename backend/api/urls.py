from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import (
    CollegeListView, VendorListView, CustomTokenObtainPairView,
    UserSignupView, CollegeAdminSignupView, VendorSignupView, StaffSignupView,
    LogoutView, VendorStatusView, StaffStatusView, CollegeAdminStatusView,
    PendingCollegeAdminsView, ApproveCollegeAdminView, RejectCollegeAdminView,
    PendingVendorsView, ApproveVendorView, RejectVendorView,
    PendingStaffView, ApproveStaffView, RejectStaffView,
    SuperAdminDashboardStatsView, CollegeAdminDashboardStatsView,
    VendorDashboardStatsView, StaffDashboardStatsView,
    VendorStaffDeactivationView, VendorStaffDeactivateActionView, VendorStaffRestoreActionView,
    CollegeAdminVendorDeactivationView, CollegeAdminVendorDeactivateActionView, CollegeAdminVendorRestoreActionView,
    SuperAdminCollegeAdminDeactivationView, SuperAdminCollegeAdminDeactivateActionView, SuperAdminCollegeAdminRestoreActionView,
    StaffSelfDeactivateView
)

urlpatterns = [
    # Include Vendor app URLs
    path('', include('vendor.urls')),

    # Include Chat app URLs
    path('v1/chat/', include('chat.urls')),

    # Helper lists
    path('v1/colleges/', CollegeListView.as_view(), name='colleges-list'),
    path('v1/vendors/', VendorListView.as_view(), name='vendors-list'),

    # Auth
    path('v1/auth/signup/user/', UserSignupView.as_view(), name='signup-user'),
    path('v1/auth/signup/vendor/', VendorSignupView.as_view(), name='signup-vendor'),
    path('v1/auth/signup/staff/', StaffSignupView.as_view(), name='signup-staff'),
    path('v1/auth/signup/college-admin/', CollegeAdminSignupView.as_view(), name='signup-college-admin'),
    path('v1/auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('v1/auth/logout/', LogoutView.as_view(), name='logout'),
    path('v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Status
    path('v1/vendor/status/', VendorStatusView.as_view(), name='vendor-status'),
    path('v1/staff/status/', StaffStatusView.as_view(), name='staff-status'),
    path('v1/college-admin/status/', CollegeAdminStatusView.as_view(), name='college-admin-status'),

    # Approvals
    path('v1/college-admin/pending/', PendingCollegeAdminsView.as_view(), name='pending-college-admins'),
    path('v1/college-admin/<int:id>/approve/', ApproveCollegeAdminView.as_view(), name='approve-college-admin'),
    path('v1/college-admin/<int:id>/reject/', RejectCollegeAdminView.as_view(), name='reject-college-admin'),
    
    path('v1/vendors/pending/', PendingVendorsView.as_view(), name='pending-vendors'),
    path('v1/vendors/<int:id>/approve/', ApproveVendorView.as_view(), name='approve-vendor'),
    path('v1/vendors/<int:id>/reject/', RejectVendorView.as_view(), name='reject-vendor'),
    
    path('v1/staff/pending/', PendingStaffView.as_view(), name='pending-staff'),
    path('v1/staff/<int:id>/approve/', ApproveStaffView.as_view(), name='approve-staff'),
    path('v1/staff/<int:id>/reject/', RejectStaffView.as_view(), name='reject-staff'),

    # Dashboard Statistics
    path('v1/dashboard/super-admin/', SuperAdminDashboardStatsView.as_view(), name='super-admin-stats'),
    path('v1/dashboard/college-admin/', CollegeAdminDashboardStatsView.as_view(), name='college-admin-stats'),
    path('v1/dashboard/vendor/', VendorDashboardStatsView.as_view(), name='vendor-stats'),
    path('v1/dashboard/staff/', StaffDashboardStatsView.as_view(), name='staff-stats'),

    # Deactivations
    path('v1/vendor/staff/', VendorStaffDeactivationView.as_view(), name='vendor-staff-deactivation-list'),
    path('v1/vendor/staff/<int:pk>/deactivate/', VendorStaffDeactivateActionView.as_view(), name='vendor-staff-deactivate'),
    path('v1/vendor/staff/<int:pk>/restore/', VendorStaffRestoreActionView.as_view(), name='vendor-staff-restore'),

    path('v1/college-admin/vendors/', CollegeAdminVendorDeactivationView.as_view(), name='college-admin-vendor-deactivation-list'),
    path('v1/college-admin/vendors/<int:pk>/deactivate/', CollegeAdminVendorDeactivateActionView.as_view(), name='college-admin-vendor-deactivate'),
    path('v1/college-admin/vendors/<int:pk>/restore/', CollegeAdminVendorRestoreActionView.as_view(), name='college-admin-vendor-restore'),

    path('v1/super-admin/college-admins/', SuperAdminCollegeAdminDeactivationView.as_view(), name='super-admin-college-admin-deactivation-list'),
    path('v1/super-admin/college-admins/<int:pk>/deactivate/', SuperAdminCollegeAdminDeactivateActionView.as_view(), name='super-admin-college-admin-deactivate'),
    path('v1/super-admin/college-admins/<int:pk>/restore/', SuperAdminCollegeAdminRestoreActionView.as_view(), name='super-admin-college-admin-restore'),

    path('v1/staff/deactivate/', StaffSelfDeactivateView.as_view(), name='staff-self-deactivate'),
]
