from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from django.db.models import Q, Count, Exists, OuterRef
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import *
from .serializers import *
from post.models import Notification
from moderation.services import moderation_service
from post.moderation import check_text_content

User = get_user_model()


def moderate_community_message(user, message):
    message = (message or "").strip()
    if not message:
        return True, ""

    is_text_safe, text_reason = check_text_content(message)
    if not is_text_safe:
        warning_issued = moderation_service.report_violation(
            user=user,
            violation_type="safety",
            content_type="post",
            content_text=message,
            rejection_reason=text_reason,
        )
        warning_msg = ""
        if warning_issued:
            status_obj = moderation_service.get_user_warning_status(user)
            warning_msg = f" Warning {status_obj['warning_count']}/{status_obj['max_warnings']} issued."
        return False, text_reason + warning_msg

    moderation_decision = moderation_service.moderate_content(
        user=user,
        content=message,
        content_type="post",
    )

    if moderation_decision.requires_review:
        return False, moderation_decision.pending_reason or "Message could not be verified."

    if not moderation_decision.is_approved:
        warning_msg = ""
        if moderation_decision.warning_issued:
            status_obj = moderation_service.get_user_warning_status(user)
            warning_msg = f" Warning {status_obj['warning_count']}/{status_obj['max_warnings']} issued."
        return False, (moderation_decision.rejection_reason or "") + warning_msg

    return True, ""


class CommunityViewSet(viewsets.ModelViewSet):
    """ViewSet for Community management"""
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Allow public read access
    lookup_field = 'name'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CommunityDetailSerializer
        return CommunitySerializer
    
    def get_queryset(self):
        # Handle Swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Community.objects.none()
        
        user = self.request.user
        is_authenticated = bool(user and user.is_authenticated)
        is_admin = bool(
            is_authenticated and (
                getattr(user, "role", None) == "admin" or getattr(user, "is_superuser", False)
            )
        )

        if is_admin:
            queryset = Community.objects.all()
            if self.action == "list":
                status_filter = self.request.query_params.get("status")
                if status_filter:
                    queryset = queryset.filter(status=status_filter)
            return queryset
        
        if self.action in ['list', 'retrieve']:
            if not is_authenticated:
                return Community.objects.filter(
                    status='approved',
                    visibility__in=['public', 'restricted'],
                ).distinct().order_by('-members_count', '-created_at')

            approved_visibility = Q(status='approved') & (
                Q(visibility='public') |
                Q(visibility='restricted')
            )
            creator_visibility = Q(created_by=user) if is_authenticated else Q(pk__in=[])
            private_visibility = (
                Q(status='approved', visibility='private', members__user=user, members__is_approved=True) |
                Q(status='approved', visibility='private', invitations__invitee=user, invitations__status='pending')
            ) if is_authenticated else Q(pk__in=[])

            # Show:
            # - Public communities (everyone can see)
            # - Restricted communities (everyone can see, but only approved members can post)
            # - Private communities (only if user is approved member OR has pending invitation)
            # Exclude private communities where user has declined invitation
            queryset = Community.objects.filter(
                approved_visibility | creator_visibility | private_visibility
            ).exclude(
                Q(visibility='private') &
                Q(invitations__invitee=user, invitations__status='declined')
            ).distinct()
            
            # Only add annotations for list action
            if self.action == 'list':
                queryset = queryset.annotate(
                    user_is_member=Exists(
                        CommunityMember.objects.filter(
                            community=OuterRef('pk'),
                            user=user,
                            is_approved=True
                        )
                    ),
                    user_has_pending_request=Exists(
                        CommunityJoinRequest.objects.filter(
                            community=OuterRef('pk'),
                            user=user,
                            status='pending'
                        )
                    ),
                    user_has_pending_invitation=Exists(
                        CommunityInvitation.objects.filter(
                            community=OuterRef('pk'),
                            invitee=user,
                            status='pending'
                        )
                    )
                ).order_by('-members_count', '-created_at')
            
            return queryset
        
        return Community.objects.all()

    def _is_admin(self, user):
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", None) == "admin" or getattr(user, "is_superuser", False))
        )

    def _run_community_moderation(self, user, name="", title="", description=""):
        combined_text = "\n".join(
            part.strip() for part in [name or "", title or "", description or ""] if part and part.strip()
        ).strip()

        if not combined_text:
            return True, ""

        is_text_safe, text_reason = check_text_content(combined_text)
        if not is_text_safe:
            warning_issued = moderation_service.report_violation(
                user=user,
                violation_type="safety",
                content_type="post",
                content_text=combined_text,
                rejection_reason=text_reason,
            )
            warning_msg = ""
            if warning_issued:
                status_obj = moderation_service.get_user_warning_status(user)
                warning_msg = f" Warning {status_obj['warning_count']}/{status_obj['max_warnings']} issued."
            return False, text_reason + warning_msg

        moderation_decision = moderation_service.moderate_content(
            user=user,
            content=combined_text,
            content_type="post",
        )

        if moderation_decision.requires_review:
            return False, moderation_decision.pending_reason or "Community sent for review."

        if not moderation_decision.is_approved:
            warning_msg = ""
            if moderation_decision.warning_issued:
                status_obj = moderation_service.get_user_warning_status(user)
                warning_msg = f" Warning {status_obj['warning_count']}/{status_obj['max_warnings']} issued."
            return False, (moderation_decision.rejection_reason or "") + warning_msg

        return True, ""

    def _moderate_optional_message(self, user, message):
        return moderate_community_message(user, message)
    
    def create(self, request, *args, **kwargs):
        can_post, block_reason = moderation_service.check_user_can_post(request.user)
        if not can_post:
            raise serializers.ValidationError({"moderation": block_reason})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_approved, moderation_reason = self._run_community_moderation(
            user=request.user,
            name=serializer.validated_data.get("name", ""),
            title=serializer.validated_data.get("title", ""),
            description=serializer.validated_data.get("description", ""),
        )
        serializer.save(
            created_by=request.user,
            status="approved" if is_approved else "pending",
            rejection_reason="" if is_approved else moderation_reason,
        )
        headers = self.get_success_headers(serializer.data)
        return Response({
            "success": True,
            "message": "Community created successfully" if is_approved else "Community sent for review",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "success": True,
                "message": "Communities retrieved successfully",
                "data": serializer.data
            })
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "message": "Communities retrieved successfully",
            "data": serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        
        # Check permissions for private communities
        if instance.visibility == 'private':
            membership = CommunityMember.objects.filter(
                user=user,
                community=instance,
                is_approved=True
            ).first()
            
            # Check if user has pending invitation
            has_pending_invitation = CommunityInvitation.objects.filter(
                invitee=user,
                community=instance,
                status='pending'
            ).exists()
            
            if not membership and not has_pending_invitation:
                return Response({
                    "success": False,
                    "error": "You must be an approved member or have a pending invitation to view this private community"
                }, status=status.HTTP_403_FORBIDDEN)
        
        # For restricted/public, everyone can view
        serializer = self.get_serializer(instance)
        return Response({
            "success": True,
            "message": "Community retrieved successfully",
            "data": serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        community = self.get_object()
        
        # Check permissions
        if not self._can_manage_community(request.user, community):
            raise PermissionDenied("You do not have permission to edit this community.")

        can_post, block_reason = moderation_service.check_user_can_post(request.user)
        if not can_post:
            raise serializers.ValidationError({"moderation": block_reason})
        
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(community, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        is_approved, moderation_reason = self._run_community_moderation(
            user=request.user,
            name=serializer.validated_data.get("name", community.name),
            title=serializer.validated_data.get("title", community.title),
            description=serializer.validated_data.get("description", community.description),
        )
        serializer.save(
            status="approved" if is_approved else "pending",
            rejection_reason="" if is_approved else moderation_reason,
        )
        
        return Response({
            "success": True,
            "message": "Community updated successfully" if is_approved else "Community update sent for review",
            "data": serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        community = self.get_object()
        
        # Only creator can delete
        if community.created_by != request.user:
            raise PermissionDenied("Only the community creator can delete it.")
        
        self.perform_destroy(community)
        return Response({
            "success": True,
            "message": "Community deleted successfully",
            "data": None
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular communities based on members count"""
        user = request.user
        
        # For unauthenticated users, only show public communities
        if not user.is_authenticated:
            communities = Community.objects.filter(
                visibility='public',
                status='approved',
            ).distinct().order_by('-members_count', '-posts_count')[:20]
        else:
            # For authenticated users, show public, restricted, and private communities user is member of OR has pending invitation
            communities = Community.objects.filter(
                Q(status='approved', visibility='public') |
                Q(status='approved', visibility='restricted') |
                Q(status='approved', visibility='private', members__user=user, members__is_approved=True) |
                Q(status='approved', visibility='private', invitations__invitee=user, invitations__status='pending') |
                Q(created_by=user)
            ).exclude(
                Q(visibility='private') & 
                Q(invitations__invitee=user, invitations__status='declined')
            ).distinct().order_by('-members_count', '-posts_count')[:20]
        
        page = self.paginate_queryset(communities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "success": True,
                "message": "Popular communities retrieved successfully",
                "data": serializer.data
            })
        
        serializer = self.get_serializer(communities, many=True)
        return Response({
            "success": True,
            "message": "Popular communities retrieved successfully",
            "data": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_communities(self, request):
        """Get communities the user is a member of"""
        communities = Community.objects.filter(
            Q(created_by=request.user) |
            Q(members__user=request.user, members__is_approved=True, status='approved')
        ).distinct().order_by('-created_at')
        
        page = self.paginate_queryset(communities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "success": True,
                "message": "Your communities retrieved successfully",
                "data": serializer.data
            })
        
        serializer = self.get_serializer(communities, many=True)
        return Response({
            "success": True,
            "message": "Your communities retrieved successfully",
            "data": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def created_by_me(self, request):
        """Get communities created by the user"""
        communities = Community.objects.filter(
            created_by=request.user
        ).order_by('-created_at')
        
        page = self.paginate_queryset(communities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "success": True,
                "message": "Communities you created retrieved successfully",
                "data": serializer.data
            })
        
        serializer = self.get_serializer(communities, many=True)
        return Response({
            "success": True,
            "message": "Communities you created retrieved successfully",
            "data": serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def members(self, request, name=None):
        """Get all members of a community - Only creator can view"""
        community = self.get_object()
        
        # Only creator can view members list
        if community.created_by != request.user:
            raise PermissionDenied("Only the community creator can view the members list.")
        
        members = CommunityMember.objects.filter(
            community=community,
            is_approved=True
        ).select_related('user').order_by('-joined_at')
        
        page = self.paginate_queryset(members)
        if page is not None:
            serializer = CommunityMemberSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response({
                "success": True,
                "message": "Community members retrieved successfully",
                "data": serializer.data
            })
        
        serializer = CommunityMemberSerializer(members, many=True, context={'request': request})
        return Response({
            "success": True,
            "message": "Community members retrieved successfully",
            "data": serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def join(self, request, name=None):
        """Join a community or request to join"""
        community = self.get_object()
        user = request.user

        if community.status != 'approved':
            return Response({
                "success": False,
                "error": "This community is not available yet."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already a member
        existing_member = CommunityMember.objects.filter(
            user=user,
            community=community
        ).first()
        
        if existing_member:
            if existing_member.is_approved:
                return Response({
                    "success": False,
                    "error": "You are already a member of this community"
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "success": False,
                    "error": "Your membership is pending approval"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Public communities: instant join
        if community.visibility == 'public':
            member = CommunityMember.objects.create(
                user=user,
                community=community,
                is_approved=True
            )
            
            return Response({
                "success": True,
                "message": "Successfully joined the community",
                "data": CommunityMemberSerializer(member).data
            }, status=status.HTTP_201_CREATED)
        
        # Restricted/Private: create join request
        else:
            can_post, block_reason = moderation_service.check_user_can_post(user)
            if not can_post:
                raise serializers.ValidationError({"moderation": block_reason})

            is_message_approved, moderation_reason = self._moderate_optional_message(
                user=user,
                message=request.data.get('message', ''),
            )
            if not is_message_approved:
                raise serializers.ValidationError({"moderation": moderation_reason})

            join_request = CommunityJoinRequest.objects.create(
                user=user,
                community=community,
                message=request.data.get('message', '')
            )
            
            # Notify admins
            admins = CommunityMember.objects.filter(
                community=community,
                role__in=['admin', 'moderator'],
                is_approved=True
            ).select_related('user')
            
            for admin in admins:
                Notification.objects.create(
                    recipient=admin.user,
                    sender=user,
                    notification_type='community_join_request',
                    community=community
                )
            
            return Response({
                "success": True,
                "message": "Join request sent successfully",
                "data": CommunityJoinRequestSerializer(join_request).data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, name=None):
        """Leave a community"""
        community = self.get_object()
        user = request.user
        
        # Can't leave if you're the creator
        if community.created_by == user:
            return Response({
                "success": False,
                "error": "Community creator cannot leave. Transfer ownership or delete the community."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        member = CommunityMember.objects.filter(
            user=user,
            community=community
        ).first()
        
        if not member:
            return Response({
                "success": False,
                "error": "You are not a member of this community"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        member.delete()
        
        return Response({
            "success": True,
            "message": "Successfully left the community",
            "data": None
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def update_member_role(self, request, name=None):
        """Update a member's role (admin/moderator only)"""
        community = self.get_object()
        
        if not self._can_manage_community(request.user, community):
            raise PermissionDenied("You do not have permission to manage members.")
        
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        
        if not user_id or not new_role:
            return Response({
                "success": False,
                "error": "user_id and role are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        member = CommunityMember.objects.filter(
            community=community,
            user_id=user_id
        ).first()
        
        if not member:
            return Response({
                "success": False,
                "error": "Member not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Can't change creator's role
        if member.user == community.created_by:
            return Response({
                "success": False,
                "error": "Cannot change the creator's role"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_role = member.role
        member.role = new_role
        member.save()
        
        # Notify the member
        Notification.objects.create(
            recipient=member.user,
            sender=request.user,
            notification_type='community_role_changed',
            community=community
        )
        
        return Response({
            "success": True,
            "message": "Member role updated successfully",
            "data": CommunityMemberSerializer(member).data
        })
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, name=None):
        """Remove a member from the community"""
        community = self.get_object()
        
        if not self._can_manage_community(request.user, community):
            raise PermissionDenied("You do not have permission to remove members.")
        
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                "success": False,
                "error": "user_id is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        member = CommunityMember.objects.filter(
            community=community,
            user_id=user_id
        ).first()
        
        if not member:
            return Response({
                "success": False,
                "error": "Member not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Can't remove creator
        if member.user == community.created_by:
            return Response({
                "success": False,
                "error": "Cannot remove the community creator"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        member.delete()
        
        return Response({
            "success": True,
            "message": "Member removed successfully",
            "data": None
        })
    
    def _can_manage_community(self, user, community):
        """Check if user can manage the community"""
        if self._is_admin(user):
            return True

        if community.created_by == user:
            return True
        
        membership = CommunityMember.objects.filter(
            user=user,
            community=community,
            is_approved=True
        ).first()
        
        return membership and membership.role in ['admin', 'moderator']

    @action(detail=True, methods=['post'])
    def approve(self, request, name=None):
        """Admin action to approve a pending or rejected community."""
        if not self._is_admin(request.user):
            raise PermissionDenied("Only admins can approve communities.")

        community = self.get_object()
        if community.status not in ["pending", "rejected"]:
            return Response(
                {
                    "success": False,
                    "message": f"Community is already {community.status}.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        community.status = "approved"
        community.rejection_reason = ""
        community.save(update_fields=["status", "rejection_reason", "updated_at"])

        return Response(
            {
                "success": True,
                "message": "Community approved successfully.",
                "data": self.get_serializer(community).data,
            }
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, name=None):
        """Admin action to reject a pending community."""
        if not self._is_admin(request.user):
            raise PermissionDenied("Only admins can reject communities.")

        community = self.get_object()
        if community.status != "pending":
            return Response(
                {
                    "success": False,
                    "message": f"Community is already {community.status}. Only pending communities can be rejected.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        community.status = "rejected"
        community.rejection_reason = request.data.get(
            "reason", "Violation of community guidelines"
        )
        community.save(update_fields=["status", "rejection_reason", "updated_at"])

        return Response(
            {
                "success": True,
                "message": "Community rejected successfully.",
                "data": self.get_serializer(community).data,
            }
        )


class CommunityJoinRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing join requests"""
    queryset = CommunityJoinRequest.objects.all()
    serializer_class = CommunityJoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']
    
    def get_queryset(self):
        # Handle Swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return CommunityJoinRequest.objects.none()
        
        user = self.request.user
        community_name = self.request.query_params.get('community')
        
        # Get communities user can manage (creator or admin/moderator)
        managed_communities = Community.objects.filter(
            Q(created_by=user) |
            Q(members__user=user, members__is_approved=True, members__role__in=['admin', 'moderator'])
        ).distinct()
        
        # Creator/admins/moderators can see join requests for their communities
        if community_name:
            try:
                community = Community.objects.get(name=community_name)
                # Check if user can manage this community
                if community in managed_communities:
                    return CommunityJoinRequest.objects.filter(
                        community=community
                    ).order_by('-created_at')
            except Community.DoesNotExist:
                pass
        
        # Combine: user's own requests + requests for communities user can manage
        return CommunityJoinRequest.objects.filter(
            Q(user=user) | Q(community__in=managed_communities)
        ).distinct().order_by('-created_at')
    
    def _can_manage_community(self, user, community):
        """Check if user can manage the community"""
        if getattr(user, "role", None) == "admin" or getattr(user, "is_superuser", False):
            return True

        if community.created_by == user:
            return True
        
        membership = CommunityMember.objects.filter(
            user=user,
            community=community,
            is_approved=True
        ).first()
        
        return membership and membership.role in ['admin', 'moderator']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a join request"""
        join_request = self.get_object()
        community = join_request.community
        
        # Check permissions - creator or admin/moderator
        if not self._can_manage_community(request.user, community):
            raise PermissionDenied("You do not have permission to approve requests.")
        
        # Create membership
        CommunityMember.objects.create(
            user=join_request.user,
            community=community,
            is_approved=True
        )
        
        # Update request
        join_request.status = 'approved'
        join_request.reviewed_by = request.user
        join_request.reviewed_at = timezone.now()
        join_request.save()
        
        # Notify user
        Notification.objects.create(
            recipient=join_request.user,
            sender=request.user,
            notification_type='community_join_approved',
            community=community
        )
        
        return Response({
            "success": True,
            "message": "Join request approved successfully",
            "data": CommunityJoinRequestSerializer(join_request).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a join request"""
        join_request = self.get_object()
        community = join_request.community
        
        # Check permissions - creator or admin/moderator
        if not self._can_manage_community(request.user, community):
            raise PermissionDenied("You do not have permission to reject requests.")
        
        join_request.status = 'rejected'
        join_request.reviewed_by = request.user
        join_request.reviewed_at = timezone.now()
        join_request.save()
        
        return Response({
            "success": True,
            "message": "Join request rejected",
            "data": CommunityJoinRequestSerializer(join_request).data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Cancel/Delete a join request - users can only cancel their own pending requests"""
        join_request = self.get_object()
        
        # Users can only cancel their own pending requests
        if join_request.user != request.user:
            raise PermissionDenied("You can only cancel your own join requests.")
        
        # Only allow canceling pending requests
        if join_request.status != 'pending':
            return Response({
                "success": False,
                "error": "You can only cancel pending requests."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(join_request)
        
        return Response({
            "success": True,
            "message": "Join request cancelled successfully",
            "data": None
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def cancel(self, request):
        """Cancel a join request by community name"""
        community_name = request.data.get('community')
        
        if not community_name:
            return Response({
                "success": False,
                "error": "community parameter is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            community = Community.objects.get(name=community_name)
        except Community.DoesNotExist:
            return Response({
                "success": False,
                "error": "Community not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Find the user's pending join request
        join_request = CommunityJoinRequest.objects.filter(
            user=request.user,
            community=community,
            status='pending'
        ).first()
        
        if not join_request:
            return Response({
                "success": False,
                "error": "No pending join request found for this community"
            }, status=status.HTTP_404_NOT_FOUND)
        
        join_request.delete()
        
        return Response({
            "success": True,
            "message": "Join request cancelled successfully",
            "data": None
        }, status=status.HTTP_200_OK)


class CommunityInvitationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing community invitations"""
    queryset = CommunityInvitation.objects.all()
    serializer_class = CommunityInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']
    
    def get_queryset(self):
        # Handle Swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return CommunityInvitation.objects.none()
        
        user = self.request.user
        community_name = self.request.query_params.get('community')
        
        # Community creators/admins can see all invitations for their communities
        if community_name:
            try:
                community = Community.objects.get(name=community_name)
                if community.created_by == user:
                    return CommunityInvitation.objects.filter(
                        community=community
                    ).order_by('-created_at')
            except Community.DoesNotExist:
                pass
        
        # Users see their own received invitations
        return CommunityInvitation.objects.filter(invitee=user).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a community invitation"""
        invitation = self.get_object()
        
        # Only invitee can accept
        if invitation.invitee != request.user:
            raise PermissionDenied("You can only accept invitations sent to you.")
        
        if invitation.status != 'pending':
            return Response({
                "success": False,
                "error": "This invitation has already been responded to."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create membership
        CommunityMember.objects.create(
            user=invitation.invitee,
            community=invitation.community,
            is_approved=True
        )
        
        # Update invitation status
        invitation.status = 'accepted'
        invitation.responded_at = timezone.now()
        invitation.save()
        
        return Response({
            "success": True,
            "message": "Invitation accepted successfully",
            "data": CommunityInvitationSerializer(invitation, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject/Decline a community invitation"""
        invitation = self.get_object()
        
        # Only invitee can reject
        if invitation.invitee != request.user:
            raise PermissionDenied("You can only reject invitations sent to you.")
        
        if invitation.status != 'pending':
            return Response({
                "success": False,
                "error": "This invitation has already been responded to."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update invitation status
        invitation.status = 'declined'
        invitation.responded_at = timezone.now()
        invitation.save()
        
        return Response({
            "success": True,
            "message": "Invitation declined",
            "data": CommunityInvitationSerializer(invitation, context={'request': request}).data
        })


class InviteUserToCommunityView(APIView):
    """Invite a user to a private community"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        community_name = request.data.get('community')
        user_id = request.data.get('user_id')
        message = request.data.get('message', '')
        
        if not community_name or not user_id:
            return Response({
                "success": False,
                "error": "community and user_id are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            community = Community.objects.get(name=community_name)
        except Community.DoesNotExist:
            return Response({
                "success": False,
                "error": "Community not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Only creator/admins can invite
        if community.created_by != request.user:
            membership = CommunityMember.objects.filter(
                user=request.user,
                community=community,
                is_approved=True
            ).first()
            if not (membership and membership.role in ['admin', 'moderator']):
                raise PermissionDenied("Only community creators and admins can invite users.")
        
        # Only private communities can be invited to
        if community.visibility != 'private':
            return Response({
                "success": False,
                "error": "Only private communities can have invitations"
            }, status=status.HTTP_400_BAD_REQUEST)

        if community.status != 'approved':
            return Response({
                "success": False,
                "error": "Only approved communities can send invitations"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            invitee = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is already a member
        if CommunityMember.objects.filter(user=invitee, community=community, is_approved=True).exists():
            return Response({
                "success": False,
                "error": "User is already a member of this community"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if invitation already exists
        existing_invitation = CommunityInvitation.objects.filter(
            community=community,
            invitee=invitee,
            status='pending'
        ).first()
        
        if existing_invitation:
            return Response({
                "success": False,
                "error": "User already has a pending invitation"
            }, status=status.HTTP_400_BAD_REQUEST)

        can_post, block_reason = moderation_service.check_user_can_post(request.user)
        if not can_post:
            raise serializers.ValidationError({"moderation": block_reason})

        is_message_approved, moderation_reason = moderate_community_message(
            user=request.user,
            message=message,
        )
        if not is_message_approved:
            raise serializers.ValidationError({"moderation": moderation_reason})
        
        # Create invitation
        invitation = CommunityInvitation.objects.create(
            community=community,
            inviter=request.user,
            invitee=invitee,
            message=message
        )
        
        # Create notification
        Notification.objects.create(
            recipient=invitee,
            sender=request.user,
            notification_type='community_invite',
            community=community
        )
        
        return Response({
            "success": True,
            "message": "Invitation sent successfully",
            "data": CommunityInvitationSerializer(invitation, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)
