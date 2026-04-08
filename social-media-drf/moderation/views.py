from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import UserModerationStatus, ModerationEvent
from accounts.permissions import IsAdmin

User = get_user_model()


class UserModerationStatusViewSet(viewsets.ModelViewSet):
    """Viewset for managing user moderation status"""

    queryset = UserModerationStatus.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "warning_status"]:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, "role") and user.role == "admin":
            queryset = UserModerationStatus.objects.all().select_related("user")

            filter_type = self.request.query_params.get("filter", None)
            if filter_type == "blocked":
                queryset = queryset.filter(is_blocked=True)
            elif filter_type == "warned":
                queryset = queryset.filter(warning_count__gt=0, is_blocked=False)
            elif filter_type == "active":
                queryset = queryset.filter(warning_count=0, is_blocked=False)

            search = self.request.query_params.get("search", None)
            if search:
                queryset = queryset.filter(
                    Q(user__username__icontains=search)
                    | Q(user__email__icontains=search)
                )

            return queryset.order_by("-updated_at")

        return UserModerationStatus.objects.filter(user=user).select_related("user")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(
                {"success": True, "data": serializer.data}
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        events = ModerationEvent.objects.filter(user=instance.user).order_by(
            "-created_at"
        )[:20]

        from moderation.serializers import ModerationEventSerializer

        events_serializer = ModerationEventSerializer(events, many=True)

        return Response(
            {
                "success": True,
                "data": {
                    **serializer.data,
                    "recent_violations": events_serializer.data,
                },
            }
        )

    @action(detail=True, methods=["post"])
    def unblock(self, request, pk=None):
        """Unblock a user"""
        instance = self.get_object()
        admin_notes = request.data.get("admin_notes", "")

        instance.unblock()
        if admin_notes:
            instance.admin_notes = admin_notes
            instance.save()

        return Response(
            {
                "success": True,
                "message": f"User {instance.user.username} has been unblocked",
            }
        )

    @action(detail=True, methods=["post"])
    def block(self, request, pk=None):
        """Manually block a user"""
        instance = self.get_object()
        reason = request.data.get("reason", "Blocked by admin")
        admin_notes = request.data.get("admin_notes", "")

        instance.is_blocked = True
        instance.blocked_at = timezone.now()
        instance.blocked_reason = reason
        instance.warning_count = 5
        instance.save()

        if admin_notes:
            instance.admin_notes = admin_notes
            instance.save()

        from moderation.services import moderation_service

        moderation_service._log_moderation_event(
            user=instance.user,
            content_type="user_action",
            decision="rejected",
            rejection_reason=reason,
            violation_type="safety",
            warning_issued=False,
            auto_blocked=True,
        )

        return Response(
            {
                "success": True,
                "message": f"User {instance.user.username} has been blocked",
            }
        )

    @action(detail=True, methods=["post"])
    def reset_warnings(self, request, pk=None):
        """Reset user's warning count"""
        instance = self.get_object()
        admin_notes = request.data.get("admin_notes", "")

        instance.reset_warnings()
        if admin_notes:
            instance.admin_notes = admin_notes
            instance.save()

        return Response(
            {
                "success": True,
                "message": f"Warning count reset for {instance.user.username}",
            }
        )

    @action(detail=True, methods=["post"])
    def reduce_warnings(self, request, pk=None):
        """Reduce user's warning count"""
        instance = self.get_object()
        amount = request.data.get("amount", 1)
        admin_notes = request.data.get("admin_notes", "")

        instance.decrement_warnings(amount)
        if admin_notes:
            instance.admin_notes = admin_notes
            instance.save()

        return Response(
            {
                "success": True,
                "message": f"Warning count reduced for {instance.user.username}",
                "warning_count": instance.warning_count,
            }
        )

    @action(detail=True, methods=["post"])
    def add_notes(self, request, pk=None):
        """Add admin notes to a user's moderation record"""
        instance = self.get_object()
        admin_notes = request.data.get("admin_notes", "")

        if not admin_notes:
            return Response(
                {"success": False, "error": "admin_notes is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_notes = instance.admin_notes or ""
        instance.admin_notes = current_notes + f"\n{admin_notes}"
        instance.save()

        return Response({"success": True, "message": "Admin notes added"})

    @action(detail=False, methods=["get"])
    def warning_status(self, request):
        """Get current user's warning status"""
        from moderation.services import moderation_service

        can_post, block_reason = moderation_service.check_user_can_post(request.user)
        status_info = moderation_service.get_user_warning_status(request.user)

        return Response(
            {
                "success": True,
                "data": {
                    "can_post": can_post,
                    "block_reason": block_reason,
                    **status_info,
                },
            }
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get moderation statistics"""
        total_users = User.objects.filter(is_active=True).count()
        blocked_count = UserModerationStatus.objects.filter(is_blocked=True).count()
        warned_count = UserModerationStatus.objects.filter(
            warning_count__gt=0, is_blocked=False
        ).count()

        recent_events = ModerationEvent.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()

        return Response(
            {
                "success": True,
                "data": {
                    "total_active_users": total_users,
                    "blocked_users": blocked_count,
                    "warned_users": warned_count,
                    "recent_violations_7days": recent_events,
                },
            }
        )


from django.utils import timezone
from datetime import timedelta
