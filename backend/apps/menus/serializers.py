from rest_framework import serializers
from .models import Category, MenuItem, MenuVariant, AddOn

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('slug', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at', 'is_deleted', 'version')


class AddOnSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOn
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at', 'is_deleted', 'version')


class MenuVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuVariant
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at', 'is_deleted', 'version')


class MenuItemSerializer(serializers.ModelSerializer):
    variants = MenuVariantSerializer(many=True, read_only=True)
    addons = AddOnSerializer(many=True, read_only=True)
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = MenuItem
        fields = '__all__'
        read_only_fields = ('slug', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at', 'is_deleted', 'version')
