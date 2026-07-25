from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from college.models import College
from accounts.models import (
    Role, ApprovalStatus, CollegeAdminProfile, VendorProfile, StaffProfile
)
from api.serializers import (
    CollegeSerializer, VendorSelectSerializer, CustomTokenObtainPairSerializer,
    UserSignupSerializer, CollegeAdminSignupSerializer, VendorSignupSerializer,
    StaffSignupSerializer, CollegeAdminProfileSerializer, VendorProfileSerializer,
    StaffProfileSerializer
)
from api.permissions import IsSuperAdmin, IsCollegeAdmin, IsVendor

# -----------------
# Public APIs
# -----------------

class CollegeListView(generics.ListCreateAPIView):
    """
    List all colleges. Allow unauthenticated requests for signup purposes.
    """
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [permissions.AllowAny]

class VendorListView(generics.ListAPIView):
    """
    List only approved vendors so staff can select during registration.
    """
    queryset = VendorProfile.objects.filter(status=ApprovalStatus.APPROVED)
    serializer_class = VendorSelectSerializer
    permission_classes = [permissions.AllowAny]

# -----------------
# Authentication APIs
# -----------------

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Unified Login View using Custom Token Serializer.
    """
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
    """
    Stateless JWT logout: can blacklist the token if sent.
    """
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
    def get_queryset(self):
        return CollegeAdminProfile.objects.filter(status=ApprovalStatus.PENDING)

class ApproveCollegeAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def put(self, request, id):
        try:
            profile = CollegeAdminProfile.objects.get(id=id)
            profile.status = ApprovalStatus.APPROVED
            profile.save()
            if profile.college.status == 'PENDING':
                profile.college.status = 'APPROVED'
                profile.college.save()
            return Response({"message": "College Admin Approved Successfully"})
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectCollegeAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def put(self, request, id):
        try:
            profile = CollegeAdminProfile.objects.get(id=id)
            profile.status = ApprovalStatus.REJECTED
            profile.save()
            return Response({"message": "College Admin Rejected Successfully"})
        except CollegeAdminProfile.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

# College Admin Actions
class PendingVendorsView(generics.ListAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]
    def get_queryset(self):
        admin_profile = self.request.user.college_admin_profile
        return VendorProfile.objects.filter(college=admin_profile.college, status=ApprovalStatus.PENDING)

class ApproveVendorView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]
    def put(self, request, id):
        try:
            admin_profile = request.user.college_admin_profile
            profile = VendorProfile.objects.get(id=id, college=admin_profile.college)
            profile.status = ApprovalStatus.APPROVED
            profile.save()
            return Response({"message": "Vendor Approved Successfully"})
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectVendorView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCollegeAdmin]
    def put(self, request, id):
        try:
            admin_profile = request.user.college_admin_profile
            profile = VendorProfile.objects.get(id=id, college=admin_profile.college)
            profile.status = ApprovalStatus.REJECTED
            profile.save()
            return Response({"message": "Vendor Rejected Successfully"})
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

# Vendor Actions
class PendingStaffView(generics.ListAPIView):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    def get_queryset(self):
        vendor_profile = self.request.user.vendor_profile
        return StaffProfile.objects.filter(vendor=vendor_profile, status=ApprovalStatus.PENDING)

class ApproveStaffView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    def put(self, request, id):
        try:
            vendor_profile = request.user.vendor_profile
            profile = StaffProfile.objects.get(id=id, vendor=vendor_profile)
            profile.status = ApprovalStatus.APPROVED
            profile.save()
            return Response({"message": "Staff Approved Successfully"})
        except StaffProfile.DoesNotExist:
            return Response({"detail": "Staff profile not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectStaffView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    def put(self, request, id):
        try:
            vendor_profile = request.user.vendor_profile
            profile = StaffProfile.objects.get(id=id, vendor=vendor_profile)
            profile.status = ApprovalStatus.REJECTED
            profile.save()
            return Response({"message": "Staff Rejected Successfully"})
        except StaffProfile.DoesNotExist:
            return Response({"detail": "Staff profile not found"}, status=status.HTTP_404_NOT_FOUND)
