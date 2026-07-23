from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'created_at')
        read_only_fields = ('id', 'created_at', 'role')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'phone_number', 'role')

    def create(self, validated_data):
        # Mandatory Rule: Registration is exclusively for Students.
        # Vendors and Admins are created internally.
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role='STUDENT'
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra responses here
        data['role'] = self.user.role
        data['email'] = self.user.email
        data['first_name'] = self.user.first_name
        return data
