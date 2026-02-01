from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Max, Count
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Room, Message, BlockedUser, UserReport, MessageRequest, AcceptedMessage
from .serializers import (
    RoomSerializer, MessageSerializer, BlockedUserSerializer, 
    UserReportSerializer, CreateUserReportSerializer, MessageRequestSerializer
)
from accounts.serializers import UserSerializer
from accounts.permissions import IsAdmin
from post.models import Follow

User = get_user_model()


class AdminChatHistoryView(APIView):
    """Admin endpoint to view chat history between two users"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get(self, request):
        reporter_id = request.query_params.get('reporter_id')
        reported_id = request.query_params.get('reported_id')
        
        if not reporter_id or not reported_id:
            return Response({
                "success": False,
                "error": "Both reporter_id and reported_id are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify users exist
            User.objects.get(id=reporter_id)
            User.objects.get(id=reported_id)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Fetch messages between these two users (both direct messages and room messages)
        # Direct messages
        direct_messages = Message.objects.filter(
            Q(sender_id=reporter_id, receiver_id=reported_id) |
            Q(sender_id=reported_id, receiver_id=reporter_id)
        ).select_related('sender', 'receiver').order_by('-created_at')[:50]
        
        # Serialize messages
        serializer = MessageSerializer(direct_messages, many=True)
        
        return Response({
            "success": True,
            "data": serializer.data,
            "count": direct_messages.count()
        }, status=status.HTTP_200_OK)
