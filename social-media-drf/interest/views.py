from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import *
from .serializers import *

""" Custom Responses """
def success_response(message, data=None, code=status.HTTP_200_OK):
    return Response({
        'success': True,
        'message': message,
        'data': data
    }, status=code)

def error_response(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({
        'success': False,
        'message': message
    }, status=code)
""" End of Custom Responses """

""" Viewset for Interest """
class CategoryViewSet(viewsets.ModelViewSet):
    """ Viewset for Category """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Category.objects.all()
        user = self.request.user
        
        # Admin or searching for specific items
        if user.is_authenticated and user.is_staff:
            is_approved_filter = self.request.query_params.get('is_approved', None)
            if is_approved_filter is not None:
                return queryset.filter(is_approved=is_approved_filter.lower() == 'true')
            return queryset
        
        # Non-staff: only see approved categories
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
        # Set created_by and default is_approved to True if staff, else False
        is_approved = self.request.user.is_staff
        serializer.save(created_by=self.request.user, is_approved=is_approved)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            msg = "Category created and approved." if request.user.is_staff else "Category proposed successfully. Awaiting admin approval."
            return success_response(msg, serializer.data, status.HTTP_201_CREATED)
        return error_response(serializer.errors)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
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
        return success_response("Category deleted successfully", None, status.HTTP_204_NO_CONTENT)

class SubCategoryViewSet(viewsets.ModelViewSet):
    """ Viewset for SubCategory """
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = SubCategory.objects.all()
        user = self.request.user
        
        if user.is_authenticated and user.is_staff:
            is_approved_filter = self.request.query_params.get('is_approved', None)
            if is_approved_filter is not None:
                return queryset.filter(is_approved=is_approved_filter.lower() == 'true')
            return queryset
            
        return queryset.filter(is_approved=True)

    def list(self, request, *args, **kwargs):
        sub_categories = self.get_queryset()
        serializer = self.get_serializer(sub_categories, many=True)
        return success_response("All sub-categories fetched successfully", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        subcat = self.get_object()
        serializer = self.get_serializer(subcat)
        return success_response("Sub-category fetched successfully", serializer.data)

    def perform_create(self, serializer):
        is_approved = self.request.user.is_staff
        serializer.save(created_by=self.request.user, is_approved=is_approved)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            msg = "Sub-category created and approved." if request.user.is_staff else "Sub-category proposed successfully. Awaiting admin approval."
            return success_response(msg, serializer.data, status.HTTP_201_CREATED)
        return error_response(serializer.errors)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
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
            return success_response("Sub-category updated successfully", serializer.data)
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
        return success_response("Sub-category deleted successfully", None, status.HTTP_204_NO_CONTENT)
    
""" End of Viewset for Interest """