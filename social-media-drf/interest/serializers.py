# serializers.py
from rest_framework import serializers
from .models import *

""" Serializers for Interest """
class SubCategorySerializer(serializers.ModelSerializer):
    """ Serializer for SubCategory """
    category_name = serializers.CharField(write_only=True)
    created_by_username = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = SubCategory
        fields = ['id', 'category_name', 'name', 'description', 'is_approved', 'created_by', 'created_by_username', 'created_at']
        read_only_fields = ['is_approved', 'created_by', 'created_at']

        ref_name = 'InterestSubCategory'

    def create(self, validated_data):
        category_name = validated_data.pop('category_name')
        category = Category.objects.get(name=category_name)
        return SubCategory.objects.create(category=category, **validated_data)


class CategorySerializer(serializers.ModelSerializer):
    """ Serializer for Category """
    subcategories = serializers.SerializerMethodField()
    created_by_username = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'subcategories', 'is_approved', 'created_by', 'created_by_username', 'created_at']
        read_only_fields = ['is_approved', 'created_by', 'created_at']

        ref_name = 'InterestCategory'

    def get_subcategories(self, obj):
        # Only show approved subcategories in the general list
        # Unless the requester is staff
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_staff:
            subs = obj.subcategories.all()
        else:
            subs = obj.subcategories.filter(is_approved=True)
        return SubCategorySerializer(subs, many=True, context=self.context).data

""" End of Serializers for Interest """