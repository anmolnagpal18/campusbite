from rest_framework import viewsets
from apps.common.permissions import IsAdminOrReadOnly
from .models import University, Building, Block
from .serializers import UniversitySerializer, BuildingSerializer, BlockSerializer

class UniversityViewSet(viewsets.ModelViewSet):
    queryset = University.objects.prefetch_related('buildings').all()
    serializer_class = UniversitySerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'code', 'city', 'state']
    filterset_fields = ['is_active']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

class BuildingViewSet(viewsets.ModelViewSet):
    queryset = Building.objects.select_related('university').prefetch_related('blocks').all()
    serializer_class = BuildingSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'university__name']
    filterset_fields = ['university', 'is_active']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

class BlockViewSet(viewsets.ModelViewSet):
    queryset = Block.objects.select_related('building', 'building__university').all()
    serializer_class = BlockSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'building__name']
    filterset_fields = ['building', 'is_active']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
