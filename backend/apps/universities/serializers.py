from rest_framework import serializers
from apps.universities.models import University, Building, Block

class BlockSerializer(serializers.ModelSerializer):
    building_name = serializers.ReadOnlyField(source='building.name')
    university_name = serializers.ReadOnlyField(source='building.university.name')
    
    class Meta:
        model = Block
        fields = '__all__'
        read_only_fields = ('slug', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at', 'is_deleted', 'version')

class BuildingSerializer(serializers.ModelSerializer):
    university_name = serializers.ReadOnlyField(source='university.name')
    blocks = BlockSerializer(many=True, read_only=True)
    
    class Meta:
        model = Building
        fields = '__all__'
        read_only_fields = ('slug', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at', 'is_deleted', 'version')

class UniversitySerializer(serializers.ModelSerializer):
    buildings = BuildingSerializer(many=True, read_only=True)

    class Meta:
        model = University
        fields = '__all__'
        read_only_fields = ('slug', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at', 'is_deleted', 'version')
