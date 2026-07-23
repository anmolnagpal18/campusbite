from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.common.permissions import IsAdminOrReadOnly
from .models import Vendor
from .serializers import VendorSerializer, VendorApprovalSerializer

class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.select_related('block', 'block__building', 'block__building__university', 'approved_by').all()
    serializer_class = VendorSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['vendor_name', 'owner_name', 'email', 'phone']
    filterset_fields = ['status', 'block', 'is_active']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def approve(self, request, pk=None):
        vendor = self.get_object()
        serializer = VendorApprovalSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(
                status=Vendor.VendorStatus.APPROVED,
                approved_by=request.user,
                approved_at=timezone.now()
            )
            return Response({'status': 'vendor approved'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def reject(self, request, pk=None):
        vendor = self.get_object()
        serializer = VendorApprovalSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(
                status=Vendor.VendorStatus.REJECTED,
                approved_by=request.user,
                approved_at=timezone.now()
            )
            return Response({'status': 'vendor rejected'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def suspend(self, request, pk=None):
        vendor = self.get_object()
        serializer = VendorApprovalSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(
                status=Vendor.VendorStatus.SUSPENDED,
                approved_by=request.user,
                approved_at=timezone.now()
            )
            return Response({'status': 'vendor suspended'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
