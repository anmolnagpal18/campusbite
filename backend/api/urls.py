from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import (
    CollegeListView, VendorListView, CustomTokenObtainPairView,
    UserSignupView, CollegeAdminSignupView, VendorSignupView, StaffSignupView,
    LogoutView, VendorStatusView, StaffStatusView, CollegeAdminStatusView,
    PendingCollegeAdminsView, ApproveCollegeAdminView, RejectCollegeAdminView,
    PendingVendorsView, ApproveVendorView, RejectVendorView,
    PendingStaffView, ApproveStaffView, RejectStaffView
)

urlpatterns = [
    # Public helper endpoints for registration
    path('colleges/', CollegeListView.as_view(), name='colleges-list'),
    path('vendors/', VendorListView.as_view(), name='vendors-list'),

    # Authentication
    path('auth/signup/user/', UserSignupView.as_view(), name='signup-user'),
    path('auth/signup/vendor/', VendorSignupView.as_view(), name='signup-vendor'),
    path('auth/signup/staff/', StaffSignupView.as_view(), name='signup-staff'),
    path('auth/signup/college-admin/', CollegeAdminSignupView.as_view(), name='signup-college-admin'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Status checks
    path('vendor/status/', VendorStatusView.as_view(), name='vendor-status'),
    path('staff/status/', StaffStatusView.as_view(), name='staff-status'),
    path('college-admin/status/', CollegeAdminStatusView.as_view(), name='college-admin-status'),

    # Approval lists and actions
    # College Admin Actions (Approving vendors)
    path('vendors/pending/', PendingVendorsView.as_view(), name='pending-vendors'),
    path('vendors/<int:id>/approve/', ApproveVendorView.as_view(), name='approve-vendor'),
    path('vendors/<int:id>/reject/', RejectVendorView.as_view(), name='reject-vendor'),

    # Vendor Actions (Approving staff)
    path('staff/pending/', PendingStaffView.as_view(), name='pending-staff'),
    path('staff/<int:id>/approve/', ApproveStaffView.as_view(), name='approve-staff'),
    path('staff/<int:id>/reject/', RejectStaffView.as_view(), name='reject-staff'),

    # Super Admin Actions (Approving College Admins)
    path('college-admin/pending/', PendingCollegeAdminsView.as_view(), name='pending-college-admins'),
    path('college-admin/<int:id>/approve/', ApproveCollegeAdminView.as_view(), name='approve-college-admin'),
    path('college-admin/<int:id>/reject/', RejectCollegeAdminView.as_view(), name='reject-college-admin'),
]
