from rest_framework import viewsets, permissions, status
from django.db.models import Q

from rest_framework.response import Response
from rest_framework.decorators import action
from .models import *
from .serializers import *
from moderation.services import moderation_service
from rest_framework import serializers
from django.db import IntegrityError


""" Custom Responses """


def success_response(message, data=None, code=status.HTTP_200_OK):
    return Response({"success": True, "message": message, "data": data}, status=code)


def error_response(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"success": False, "message": message}, status=code)


""" End of Custom Responses """

""" Viewset for Interest """


class CategoryViewSet(viewsets.ModelViewSet):
    """Viewset for Category"""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Category.objects.all()
        user = self.request.user

        # Admin or searching for specific items
        if user.is_authenticated and user.is_staff:
            is_approved_filter = self.request.query_params.get("is_approved", None)
            if is_approved_filter is not None:
                return queryset.filter(is_approved=is_approved_filter.lower() == "true")
            return queryset

        # Non-staff: only see approved categories OR categories they proposed themselves
        if user.is_authenticated:
            return queryset.filter(Q(is_approved=True) | Q(created_by=user))
        return queryset.filter(is_approved=True)


    def list(self, request, *args, **kwargs):
        categories = self.get_queryset()
        serializer = self.get_serializer(categories, many=True)
        return success_response("All categories fetched successfully", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        category = self.get_object()
        serializer = self.get_serializer(category)
        return success_response("Category fetched successfully", serializer.data)

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save(created_by=self.request.user, is_approved=True)
            return

        name = serializer.validated_data.get("name", "").strip()
        description = serializer.validated_data.get("description", "").strip()


        moderation_decision = moderation_service.moderate_category_proposal(
            user=self.request.user, name=name, description=description
        )

        if not moderation_decision.is_approved:
            if moderation_decision.requires_review:
                serializer.save(created_by=self.request.user, is_approved=False)
                return
                
            warning_msg = ""
            if moderation_decision.warning_issued:
                status_obj = moderation_service.get_user_warning_status(self.request.user)
                warning_msg = f" Warning {status_obj['warning_count']}/{status_obj['max_warnings']} issued."
                
            raise serializers.ValidationError(
                {"moderation": moderation_decision.rejection_reason + warning_msg}
            )


        try:
            serializer.save(created_by=self.request.user, is_approved=False)
        except IntegrityError:
            raise serializers.ValidationError(
                {"name": f"A category with the name '{name.strip()}' already exists."}
            )


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            msg = (
                "Category created and approved."
                if request.user.is_staff
                else "Category proposed successfully. Awaiting admin approval."
            )
            return success_response(msg, serializer.data, status.HTTP_201_CREATED)
        return error_response(serializer.errors)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        category = self.get_object()
        category.is_approved = True
        category.save()
        return success_response(f"Category '{category.name}' approved successfully.")

    # Update (PUT)
    def update(self, request, *args, **kwargs):
        category = self.get_object()
        serializer = self.get_serializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response("Category updated successfully", serializer.data)
        return error_response(serializer.errors)

    # Partial Update (PATCH)
    def partial_update(self, request, *args, **kwargs):
        category = self.get_object()
        serializer = self.get_serializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response("Category partially updated", serializer.data)
        return error_response(serializer.errors)

    # Delete
    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        category.delete()
        return success_response(
            "Category deleted successfully", None, status.HTTP_204_NO_CONTENT
        )


class SubCategoryViewSet(viewsets.ModelViewSet):
    """Viewset for SubCategory"""

    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = SubCategory.objects.all()
        user = self.request.user

        if user.is_authenticated and user.is_staff:
            is_approved_filter = self.request.query_params.get("is_approved", None)
            if is_approved_filter is not None:
                return queryset.filter(is_approved=is_approved_filter.lower() == "true")
            return queryset

        # Non-staff: only see approved categories OR categories they proposed themselves
        if user.is_authenticated:
            return queryset.filter(Q(is_approved=True) | Q(created_by=user))
        return queryset.filter(is_approved=True)


    def list(self, request, *args, **kwargs):
        sub_categories = self.get_queryset()
        serializer = self.get_serializer(sub_categories, many=True)
        return success_response(
            "All sub-categories fetched successfully", serializer.data
        )

    def retrieve(self, request, *args, **kwargs):
        subcat = self.get_object()
        serializer = self.get_serializer(subcat)
        return success_response("Sub-category fetched successfully", serializer.data)

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save(created_by=self.request.user, is_approved=True)
            return

        name = serializer.validated_data.get("name", "").strip()
        description = serializer.validated_data.get("description", "").strip()
        category_id = serializer.validated_data.get("category", None)


        moderation_decision = moderation_service.moderate_category_proposal(
            user=self.request.user,
            name=name,
            description=description,
            parent_category_id=category_id,
        )

        if not moderation_decision.is_approved:
            if moderation_decision.requires_review:
                serializer.save(created_by=self.request.user, is_approved=False)
                return
                
            warning_msg = ""
            if moderation_decision.warning_issued:
                status_obj = moderation_service.get_user_warning_status(self.request.user)
                warning_msg = f" Warning {status_obj['warning_count']}/{status_obj['max_warnings']} issued."
                
            raise serializers.ValidationError(
                {"moderation": moderation_decision.rejection_reason + warning_msg}
            )


        try:
            serializer.save(created_by=self.request.user, is_approved=False)
        except IntegrityError:
            raise serializers.ValidationError(
                {"name": f"A sub-category with the name '{name.strip()}' already exists."}
            )


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            msg = (
                "Sub-category created and approved."
                if request.user.is_staff
                else "Sub-category proposed successfully. Awaiting admin approval."
            )
            return success_response(msg, serializer.data, status.HTTP_201_CREATED)
        return error_response(serializer.errors)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        subcat = self.get_object()
        subcat.is_approved = True
        subcat.save()
        return success_response(f"Sub-category '{subcat.name}' approved successfully.")

    # Update
    def update(self, request, *args, **kwargs):
        subcat = self.get_object()
        serializer = self.get_serializer(subcat, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                "Sub-category updated successfully", serializer.data
            )
        return error_response(serializer.errors)

    # Partial update
    def partial_update(self, request, *args, **kwargs):
        subcat = self.get_object()
        serializer = self.get_serializer(subcat, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response("Sub-category partially updated", serializer.data)
        return error_response(serializer.errors)

    # Delete
    def destroy(self, request, *args, **kwargs):
        subcat = self.get_object()
        subcat.delete()
        return success_response(
            "Sub-category deleted successfully", None, status.HTTP_204_NO_CONTENT
        )


""" End of Viewset for Interest """
