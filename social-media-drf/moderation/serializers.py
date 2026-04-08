from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserModerationStatus, ModerationEvent, CategoryProposal

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email"]


class UserModerationStatusSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = UserModerationStatus
        fields = [
            "id",
            "user",
            "username",
            "email",
            "warning_count",
            "is_blocked",
            "blocked_at",
            "blocked_reason",
            "admin_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ModerationEventSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ModerationEvent
        fields = [
            "id",
            "user",
            "username",
            "content_type",
            "content_id",
            "content_text",
            "violation_type",
            "decision",
            "rejection_reason",
            "warning_issued",
            "auto_blocked",
            "ai_model_used",
            "ai_flags",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CategoryProposalSerializer(serializers.ModelSerializer):
    proposer_username = serializers.CharField(
        source="proposer.username", read_only=True
    )
    reviewed_by_username = serializers.CharField(
        source="reviewed_by.username", read_only=True
    )

    class Meta:
        model = CategoryProposal
        fields = [
            "id",
            "proposer",
            "proposer_username",
            "proposal_type",
            "name",
            "description",
            "parent_category",
            "status",
            "rejection_reason",
            "ai_confidence",
            "reviewed_by",
            "reviewed_by_username",
            "reviewed_at",
            "admin_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
