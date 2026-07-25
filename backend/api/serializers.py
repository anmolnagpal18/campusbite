from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from accounts.models import Role, ApprovalStatus, UserProfile, CollegeAdminProfile, VendorProfile, StaffProfile
from college.models import College
from api.validators import validate_password_strength
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = ['id', 'name', 'city', 'status']

class VendorSelectSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.name', read_only=True)
    owner_email = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model = VendorProfile
        fields = ['id', 'shop_name', 'college_name', 'owner_email']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'role': self.user.role,
            'status': self.user.approval_status
        }
        return data

class UserSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                role=Role.USER
            )
            UserProfile.objects.create(user=user)
            return user

class CollegeAdminSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    confirm_password = serializers.CharField(write_only=True)
    college = serializers.PrimaryKeyRelatedField(queryset=College.objects.all(), required=False, allow_null=True)
    college_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    college_city = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if not data.get('college') and not (data.get('college_name') and data.get('college_city')):
            raise serializers.ValidationError({"college": "Must select an existing college or provide a new college name and city."})
        return data

    def create(self, validated_data):
        with transaction.atomic():
            college = validated_data.get('college')
            if not college:
                college, created = College.objects.get_or_create(
                    name=validated_data['college_name'],
                    defaults={'city': validated_data['college_city'], 'status': 'PENDING'}
                )
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                role=Role.COLLEGE_ADMIN
            )
            CollegeAdminProfile.objects.create(
                user=user,
                college=college,
                status=ApprovalStatus.PENDING
            )
            return user

class VendorSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    confirm_password = serializers.CharField(write_only=True)
    college = serializers.PrimaryKeyRelatedField(queryset=College.objects.all())
    shop_name = serializers.CharField(max_length=255)
    shop_area = serializers.CharField(max_length=255)
    block = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                role=Role.VENDOR
            )
            VendorProfile.objects.create(
                user=user,
                college=validated_data['college'],
                shop_name=validated_data['shop_name'],
                shop_area=validated_data['shop_area'],
                block=validated_data['block'],
                status=ApprovalStatus.PENDING
            )
            return user

class StaffSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    confirm_password = serializers.CharField(write_only=True)
    vendor = serializers.PrimaryKeyRelatedField(queryset=VendorProfile.objects.all())

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                role=Role.STAFF
            )
            StaffProfile.objects.create(
                user=user,
                vendor=validated_data['vendor'],
                status=ApprovalStatus.PENDING
            )
            return user

class CollegeAdminProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    college_name = serializers.CharField(source='college.name', read_only=True)
    class Meta:
        model = CollegeAdminProfile
        fields = ['id', 'user_email', 'college_name', 'status']

class VendorProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    college_name = serializers.CharField(source='college.name', read_only=True)
    class Meta:
        model = VendorProfile
        fields = ['id', 'user_email', 'college_name', 'shop_name', 'shop_area', 'block', 'status']

class StaffProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    vendor_shop = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_owner = serializers.CharField(source='vendor.user.email', read_only=True)
    class Meta:
        model = StaffProfile
        fields = ['id', 'user_email', 'vendor_shop', 'vendor_owner', 'status']
