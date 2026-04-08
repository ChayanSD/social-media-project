from django.shortcuts import render
from .models import *
from .serializers import *
from accounts.permissions import *
from rest_framework.permissions import (
    IsAuthenticated,
    IsAuthenticatedOrReadOnly,
    AllowAny,
)
from rest_framework import viewsets
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework import filters
from rest_framework.decorators import action
import logging
from moderation.services import moderation_service
from post.moderation import check_text_content, check_image_content


user = get_user_model()
logger = logging.getLogger(__name__)


# Create your views here.
def success_response(message, data=None, code=status.HTTP_200_OK):
    return Response({"success": True, "message": message, "data": data}, status=code)


def error_response(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"success": False, "message": message}, status=code)


class MarketplaceCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    permission_classes = [IsOwnerOrReadOnly]

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(
            "Category list retrieved successfully.", serializer.data
        )

    def retrieve(self, request, pk=None, *args, **kwargs):
        category = get_object_or_404(Category, pk=pk)
        serializer = self.get_serializer(category)
        return success_response("Category retrieved successfully.", serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return success_response(
                "Category created successfully.",
                serializer.data,
                status.HTTP_201_CREATED,
            )

        return error_response("Category creation failed.", serializer.errors)

    def update(self, request, pk=None, *args, **kwargs):
        category = get_object_or_404(Category, pk=pk)
        serializer = self.get_serializer(category, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return success_response("Category updated successfully.", serializer.data)

        return error_response("Category update failed.", serializer.errors)

    def destroy(self, request, pk=None, *args, **kwargs):
        category = get_object_or_404(Category, pk=pk)
        category.delete()
        return success_response(
            "Category deleted successfully.", None, status.HTTP_204_NO_CONTENT
        )


class MarketplaceSubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [IsOwnerOrReadOnly]

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(
            "SubCategory list retrieved successfully.", serializer.data
        )

    def retrieve(self, request, pk=None, *args, **kwargs):
        subcategory = get_object_or_404(SubCategory, pk=kwargs["pk"])
        serializer = self.get_serializer(subcategory)
        return success_response("SubCategory retrieved successfully.", serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                "SubCategory created successfully.",
                serializer.data,
                status.HTTP_201_CREATED,
            )
        return error_response("SubCategory creation failed.", serializer.errors)

    def update(self, request, pk=None, *args, **kwargs):
        subcategory = get_object_or_404(SubCategory, pk=pk)
        serializer = self.get_serializer(subcategory, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                "SubCategory updated successfully.", serializer.data
            )
        return error_response("SubCategory update failed.", serializer.errors)

    def destroy(self, request, pk=None, *args, **kwargs):
        subcategory = get_object_or_404(SubCategory, pk=pk)
        subcategory.delete()
        return success_response(
            "SubCategory deleted successfully.", None, status.HTTP_204_NO_CONTENT
        )


class MarketplaceProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = [
        "status",
        "sub_category",
        "sub_category__category",
        "sub_category__name",
        "sub_category__category__name",
    ]
    search_fields = ["name", "description", "location"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        # Handle Swagger schema generation
        if getattr(self, "swagger_fake_view", False):
            return Product.objects.none()

        queryset = super().get_queryset()
        user = self.request.user

        # Admin → show all
        if user.is_staff or getattr(user, "role", None) == "admin":
            return queryset

        # Show only user's products
        my_products = self.request.query_params.get("my_products", None)
        if my_products:
            return queryset.filter(user=user)

        # Show approved + own products
        return queryset.filter(Q(status="approved") | Q(user=user))

    def _build_warning_message(self, user):
        status_obj = moderation_service.get_user_warning_status(user)
        return f" Warning {status_obj['warning_count']}/{status_obj['max_warnings']} issued."

    def _run_product_moderation(self, request, *, name="", description="", image=None):
        combined_text = f"{name or ''}\n{description or ''}".strip()

        if combined_text:
            is_text_safe, text_reason = check_text_content(combined_text)
            if not is_text_safe:
                warning_issued = moderation_service.report_violation(
                    user=request.user,
                    violation_type="safety",
                    content_type="marketplace_product",
                    content_text=combined_text,
                    rejection_reason=text_reason,
                )
                warning_msg = self._build_warning_message(request.user) if warning_issued else ""
                return False, text_reason + warning_msg

            text_moderation = moderation_service.moderate_content(
                user=request.user,
                content=combined_text,
                content_type="marketplace_product",
            )

            if text_moderation.requires_review:
                return False, text_moderation.pending_reason or "Service sent for review."

            if not text_moderation.is_approved:
                warning_msg = ""
                if text_moderation.warning_issued:
                    warning_msg = self._build_warning_message(request.user)
                return False, (text_moderation.rejection_reason or "") + warning_msg

        if image:
            img_safe, img_reason = check_image_content(image)
            if not img_safe:
                warning_issued = moderation_service.report_violation(
                    user=request.user,
                    violation_type="safety",
                    content_type="marketplace_product",
                    content_text=f"Marketplace image violation detected: {name}",
                    rejection_reason=img_reason,
                )
                warning_msg = self._build_warning_message(request.user) if warning_issued else ""
                return False, img_reason + warning_msg

        return True, ""

    def list(self, request, *args, **kwargs):
        from datetime import datetime
        import logging

        logger = logging.getLogger(__name__)

        queryset = self.filter_queryset(self.get_queryset())

        # Filter by date range if provided
        start_date = request.query_params.get("start_date", None)
        end_date = request.query_params.get("end_date", None)

        logger.info(f"Product list - start_date: {start_date}, end_date: {end_date}")

        if start_date:
            try:
                date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
                queryset = queryset.filter(created_at__date__gte=date_obj)
                logger.info(f"Applied start_date filter: {date_obj}")
            except (ValueError, TypeError) as e:
                logger.error(f"Error parsing start_date '{start_date}': {str(e)}")
                pass

        if end_date:
            try:
                date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
                queryset = queryset.filter(created_at__date__lte=date_obj)
                logger.info(f"Applied end_date filter: {date_obj}")
            except (ValueError, TypeError) as e:
                logger.error(f"Error parsing end_date '{end_date}': {str(e)}")
                pass

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(
                {
                    "success": True,
                    "message": "Product list retrieved successfully.",
                    "data": serializer.data,
                }
            )

        serializer = self.get_serializer(queryset, many=True)
        return success_response("Product list retrieved successfully.", serializer.data)

    def retrieve(self, request, pk=None, *args, **kwargs):
        product = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(product)
        return success_response("Product retrieved successfully.", serializer.data)

    def create(self, request, *args, **kwargs):
        try:
            can_post, block_reason = moderation_service.check_user_can_post(request.user)
            if not can_post:
                return Response(
                    {"success": False, "message": block_reason},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"success": False, "message": "Service creation failed.", "data": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            requested_status = serializer.validated_data.get("status")
            if requested_status == "draft":
                product = serializer.save(user=request.user, status="draft")
                return success_response(
                    "Draft saved successfully.",
                    self.get_serializer(product).data,
                    status.HTTP_201_CREATED,
                )

            # Check if user can post
            from .models import UserSubscription

            # Get the most recent active subscription
            subscription = (
                UserSubscription.objects.filter(user=request.user, status="active")
                .order_by("-created_at")
                .first()
            )

            if not subscription:
                # If no active, get latest overall or create free one
                subscription = (
                    UserSubscription.objects.filter(user=request.user)
                    .order_by("-created_at")
                    .first()
                )
                if not subscription:
                    subscription = UserSubscription.objects.create(
                        user=request.user, plan=None, status="active"
                    )

            subscription.reset_monthly_usage()

            can_post = subscription.can_post()

            if not can_post:
                remaining = subscription.get_remaining_posts()
                return error_response(
                    f"You have reached your posting limit. Remaining posts: {remaining}. "
                    "Please upgrade your plan or purchase additional posts.",
                    status.HTTP_403_FORBIDDEN,
                )

            is_moderation_approved, moderation_reason = self._run_product_moderation(
                request,
                name=serializer.validated_data.get("name", ""),
                description=serializer.validated_data.get("description", ""),
                image=serializer.validated_data.get("image"),
            )

            product = serializer.save(
                user=request.user,
                status="approved" if is_moderation_approved else "pending",
                rejection_reason="" if is_moderation_approved else moderation_reason,
            )

            subscription.posts_used_this_month += 1
            subscription.save()

            return success_response(
                "Service created successfully." if is_moderation_approved else "Service sent for review.",
                self.get_serializer(product).data,
                status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error creating service: {str(e)}", exc_info=True)
            return error_response(
                f"Service creation failed: {str(e)}",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, pk=None, *args, **kwargs):
        product = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(product, data=request.data)

        if serializer.is_valid():
            requested_status = serializer.validated_data.get("status", product.status)
            if requested_status == "draft":
                updated_product = serializer.save(status="draft")
                return success_response(
                    "Draft updated successfully.",
                    self.get_serializer(updated_product).data,
                )

            is_moderation_approved, moderation_reason = self._run_product_moderation(
                request,
                name=serializer.validated_data.get("name", product.name),
                description=serializer.validated_data.get("description", product.description),
                image=serializer.validated_data.get("image"),
            )
            updated_product = serializer.save(
                status="approved" if is_moderation_approved else "pending",
                rejection_reason="" if is_moderation_approved else moderation_reason,
            )
            return success_response(
                "Product updated successfully." if is_moderation_approved else "Service sent for review.",
                self.get_serializer(updated_product).data,
            )

        return error_response("Product update failed.", serializer.errors)

    def partial_update(self, request, pk=None, *args, **kwargs):
        product = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(product, data=request.data, partial=True)

        if serializer.is_valid():
            requested_status = serializer.validated_data.get("status", product.status)
            if requested_status == "draft":
                updated_product = serializer.save(status="draft")
                return success_response(
                    "Draft updated successfully.",
                    self.get_serializer(updated_product).data,
                )

            is_moderation_approved, moderation_reason = self._run_product_moderation(
                request,
                name=serializer.validated_data.get("name", product.name),
                description=serializer.validated_data.get("description", product.description),
                image=serializer.validated_data.get("image"),
            )
            updated_product = serializer.save(
                status="approved" if is_moderation_approved else "pending",
                rejection_reason="" if is_moderation_approved else moderation_reason,
            )
            return success_response(
                "Product partially updated successfully." if is_moderation_approved else "Service sent for review.",
                self.get_serializer(updated_product).data,
            )

        return error_response("Product partial update failed.", serializer.errors)

    def destroy(self, request, pk=None, *args, **kwargs):
        product = get_object_or_404(self.get_queryset(), pk=pk)
        product.delete()
        return success_response(
            "Product deleted successfully.", None, status.HTTP_204_NO_CONTENT
        )

    # -------- MODERATION ACTIONS -------- #

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Admin action to approve a pending product"""
        if not (hasattr(request.user, "role") and request.user.role == "admin"):
            return error_response(
                "Only admins can approve products.", status.HTTP_403_FORBIDDEN
            )

        product = self.get_object()
        old_status = product.status

        # Only allow approving pending products
        if old_status != "pending":
            return error_response(
                f"Product is already {old_status}. Only pending products can be approved.",
                status.HTTP_400_BAD_REQUEST,
            )

        # Approve the product
        product.status = "approved"
        product.rejection_reason = ""
        product.save()

        serializer = self.get_serializer(product)
        return success_response("Product approved successfully.", serializer.data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Admin action to reject a pending product"""
        if not (hasattr(request.user, "role") and request.user.role == "admin"):
            return error_response(
                "Only admins can reject products.", status.HTTP_403_FORBIDDEN
            )

        product = self.get_object()

        if product.status != "pending":
            return error_response(
                f"Product is already {product.status}. Only pending products can be rejected.",
                status.HTTP_400_BAD_REQUEST,
            )

        product.status = "rejected"
        product.rejection_reason = request.data.get(
            "reason", "Violation of marketplace guidelines"
        )
        product.save()

        serializer = self.get_serializer(product)
        return success_response("Product rejected successfully.", serializer.data)

    # -------- CUSTOM ACTIONS -------- #

    @action(detail=False, methods=["get"])
    def my_products(self, request):
        """Get products created by current user"""
        queryset = self.get_queryset().filter(user=request.user)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return success_response(
                "My products fetched successfully.", serializer.data
            )

        serializer = self.get_serializer(queryset, many=True)
        return success_response("My products fetched successfully.", serializer.data)

    @action(detail=False, methods=["get"])
    def by_category(self, request):
        """Get products by category id"""
        category_id = request.query_params.get("category_id")

        if not category_id:
            return error_response("category_id parameter is required")

        queryset = self.get_queryset().filter(sub_category__category_id=category_id)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return success_response(
                "Products by category fetched successfully.", serializer.data
            )

        serializer = self.get_serializer(queryset, many=True)
        return success_response(
            "Products by category fetched successfully.", serializer.data
        )
