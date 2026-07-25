from django.db import models
from django.contrib.auth import get_user_model
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination

from college.models import College
from core.enums import Role, ApprovalStatus, ItemAvailability
from accounts.models import (
    CollegeAdminProfile, VendorProfile, StaffProfile, UserProfile
)
from vendor.models import FoodCategory, FoodItem
from api.serializers import (
    CollegeSerializer, VendorSelectSerializer, CustomTokenObtainPairSerializer,
    UserSignupSerializer, CollegeAdminSignupSerializer, VendorSignupSerializer,
    StaffSignupSerializer, CollegeAdminProfileSerializer, VendorProfileSerializer,
    StaffProfileSerializer
)
from api.permissions import IsSuperAdmin, IsCollegeAdmin, IsVendor
from api.services import ApprovalService

User = get_user_model()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# -----------------
# Public APIs
# -----------------

class CollegeListView(generics.ListCreateAPIView):
    queryset = College.objects.all().order_by('-created_at')
    serializer_class = CollegeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

class VendorListView(generics.ListAPIView):
    queryset = VendorProfile.objects.filter(status=ApprovalStatus.APPROVED).order_by('-created_at')
    serializer_class = VendorSelectSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

# -----------------
# Authentication APIs
# -----------------

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

class UserSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Account Created Successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CollegeAdminSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = CollegeAdminSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Account Created Successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VendorSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = VendorSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Account Created Successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StaffSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = StaffSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Account Created Successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"message": "Logout successful (token discarded)"}, status=status.HTTP_200_OK)

# -----------------
# Status APIs
# -----------------

class VendorStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    def get(self, request):
        try:
            profile = request.user.vendor_profile
            return Response({"status": profile.status})
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

class StaffStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != Role.STAFF:
            return Response({"detail": "Not a Staff user"}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = request.user.staff_profile
            return Response({"status": profile.status})
        except StaffProfile.DoesNotExist:
            return Response({"detail": "Staff profile not found"}, status=status.HTTP_404_NOT_FOUND)

class CollegeAdminStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != Role.COLLEGE_ADMIN:
            return Response({"detail": "Not a College Admin user"}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = request.user.college_admin_profile
            return Response({"status": profile.status})
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "College Admin profile not found"}, status=status.HTTP_404_NOT_FOUND)

# -----------------
# Approval Management APIs
# -----------------

# Super Admin Actions
class PendingCollegeAdminsView(generics.ListAPIView):
    serializer_class = CollegeAdminProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = CollegeAdminProfile.objects.filter(status=ApprovalStatus.PENDING).order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(user__email__icontains=search) | 
                models.Q(college__name__icontains=search)
            )
        return queryset

class ApproveCollegeAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def put(self, request, id):
        try:
            profile = CollegeAdminProfile.objects.get(id=id)
            ApprovalService.approve_profile(profile, approved_by=request.user)
            return Response({"message": "College Admin Approved Successfully"})
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectCollegeAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def put(self, request, id):
        try:
            profile = CollegeAdminProfile.objects.get(id=id)
            ApprovalService.reject_profile(profile, approved_by=request.user)
            return Response({"message": "College Admin Rejected Successfully"})
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

# College Admin Actions
class PendingVendorsView(generics.ListAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        admin_profile = self.request.user.college_admin_profile
        queryset = VendorProfile.objects.filter(college=admin_profile.college, status=ApprovalStatus.PENDING).order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(user__email__icontains=search) | 
                models.Q(restaurant__name__icontains=search)
            )
        return queryset

class ApproveVendorView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]
    def put(self, request, id):
        try:
            admin_profile = request.user.college_admin_profile
            profile = VendorProfile.objects.get(id=id, college=admin_profile.college)
            ApprovalService.approve_profile(profile, approved_by=request.user)
            return Response({"message": "Vendor Approved Successfully"})
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectVendorView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]
    def put(self, request, id):
        try:
            admin_profile = request.user.college_admin_profile
            profile = VendorProfile.objects.get(id=id, college=admin_profile.college)
            ApprovalService.reject_profile(profile, approved_by=request.user)
            return Response({"message": "Vendor Rejected Successfully"})
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

# Vendor Actions
class PendingStaffView(generics.ListAPIView):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        vendor_profile = self.request.user.vendor_profile
        queryset = StaffProfile.objects.filter(vendor=vendor_profile, status=ApprovalStatus.PENDING).order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(user__email__icontains=search)
        return queryset

class ApproveStaffView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    def put(self, request, id):
        try:
            vendor_profile = request.user.vendor_profile
            profile = StaffProfile.objects.get(id=id, vendor=vendor_profile)
            ApprovalService.approve_profile(profile, approved_by=request.user)
            return Response({"message": "Staff Approved Successfully"})
        except StaffProfile.DoesNotExist:
            return Response({"detail": "Staff profile not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectStaffView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    def put(self, request, id):
        try:
            vendor_profile = request.user.vendor_profile
            profile = StaffProfile.objects.get(id=id, vendor=vendor_profile)
            ApprovalService.reject_profile(profile, approved_by=request.user)
            return Response({"message": "Staff Rejected Successfully"})
        except StaffProfile.DoesNotExist:
            return Response({"detail": "Staff profile not found"}, status=status.HTTP_404_NOT_FOUND)

# -----------------
# Dashboard Statistics APIs
# -----------------

class SuperAdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def get(self, request):
        stats = {
            "total_colleges": College.objects.count(),
            "total_vendors": VendorProfile.objects.count(),
            "total_staff": StaffProfile.objects.count(),
            "total_users": UserProfile.objects.count(),
            "pending_college_admins": CollegeAdminProfile.objects.filter(status=ApprovalStatus.PENDING).count()
        }
        return Response(stats)

class CollegeAdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]
    def get(self, request):
        admin_profile = request.user.college_admin_profile
        stats = {
            "vendors_pending": VendorProfile.objects.filter(college=admin_profile.college, status=ApprovalStatus.PENDING).count(),
            "vendors_approved": VendorProfile.objects.filter(college=admin_profile.college, status=ApprovalStatus.APPROVED).count(),
            "total_restaurants": VendorProfile.objects.filter(college=admin_profile.college, restaurant__isnull=False).count()
        }
        return Response(stats)

class VendorDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    def get(self, request):
        vendor_profile = request.user.vendor_profile
        restaurant = getattr(vendor_profile, 'restaurant', None)
        
        total_categories = 0
        total_items = 0
        available_items = 0
        
        if restaurant:
            total_categories = FoodCategory.objects.filter(restaurant=restaurant).count()
            total_items = FoodItem.objects.filter(category__restaurant=restaurant).count()
            available_items = FoodItem.objects.filter(category__restaurant=restaurant, availability=ItemAvailability.AVAILABLE).count()
            
        stats = {
            "total_categories": total_categories,
            "total_items": total_items,
            "available_items": available_items,
            "today_orders": 0,
            "today_revenue": 0.00,
            "pending_staff": StaffProfile.objects.filter(vendor=vendor_profile, status=ApprovalStatus.PENDING).count(),
        }
        return Response(stats)

class StaffDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != Role.STAFF:
            return Response({"detail": "Not a Staff user"}, status=status.HTTP_403_FORBIDDEN)
        vendor_profile = request.user.staff_profile.vendor
        stats = {
            "vendor_shop_name": vendor_profile.restaurant.name if hasattr(vendor_profile, 'restaurant') else "Stall",
            "preparing_orders": 0,
            "ready_orders": 0
        }
        return Response(stats)
