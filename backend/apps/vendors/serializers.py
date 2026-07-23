from rest_framework import serializers
from apps.vendors.models import Vendor
from apps.universities.serializers import BlockSerializer

class VendorSerializer(serializers.ModelSerializer):
    block_details = BlockSerializer(source='block', read_only=True)
    approved_by_name = serializers.ReadOnlyField(source='approved_by.email')

    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = (
            'slug', 'status', 'approved_by', 'approved_at', 
            'approval_notes', 'rejection_reason',
            'created_by', 'updated_by', 'created_at', 'updated_at', 
            'deleted_at', 'is_deleted', 'version'
        )

class VendorApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ('status', 'approval_notes', 'rejection_reason')

    def validate_status(self, value):
        if value not in dict(Vendor.VendorStatus.choices):
            raise serializers.ValidationError("Invalid status")
        return value
