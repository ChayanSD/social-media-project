import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import User
from chats.models import Room, Message, MessageReaction
from chats.serializers import MessageSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def test_message_reactions():
    print("Testing Message Reactions...")
    
    # Setup users and chat
    user1, _ = User.objects.get_or_create(username='react_user1', defaults={'email': 'u1@react.com'})
    user2, _ = User.objects.get_or_create(username='react_user2', defaults={'email': 'u2@react.com'})
    
    room = Room.objects.create(is_group=False)
    room.participants.add(user1, user2)
    
    message = Message.objects.create(
        room=room,
        sender=user1,
        content="Hello with reaction!"
    )
    
    factory = APIRequestFactory()
    
    # 1. Test Toggle Reaction (Add)
    from chats.views import MessageReactionViewSet
    viewset = MessageReactionViewSet()
    viewset.format_kwarg = None # Fix for GenericViewSet toggle
    
    request = factory.post('/api/chat/reactions/toggle/', {
        'message_id': message.id,
        'reaction_type': 'love'
    })
    request.user = user1
    
    response = viewset.toggle(request)
    assert response.status_code == 200
    assert response.data['data']['action'] == 'added'
    assert response.data['data']['reaction_type'] == 'love'
    print("Toggle Reaction (Add) SUCCESS!")
    
    # 2. Verify in Message Serializer
    req = factory.get('/')
    req.user = user1
    # Create request object for serializer context
    from rest_framework.views import APIView
    req = APIView().initialize_request(req)
    
    serializer = MessageSerializer(message, context={'request': req})
    data = serializer.data
    
    assert data['reactions']['love'] == 1
    assert data['user_reaction'] == 'love'
    print("Message Serializer Reaction Data SUCCESS!")
    
    # 3. Test Toggle Reaction (Update)
    request = factory.post('/api/chat/reactions/toggle/', {
        'message_id': message.id,
        'reaction_type': 'haha'
    })
    request.user = user1
    response = viewset.toggle(request)
    assert response.data['data']['action'] == 'updated'
    assert response.data['data']['reaction_type'] == 'haha'
    print("Toggle Reaction (Update) SUCCESS!")
    
    # 4. Test Toggle Reaction (Remove)
    request = factory.post('/api/chat/reactions/toggle/', {
        'message_id': message.id,
        'reaction_type': 'haha'
    })
    request.user = user1
    response = viewset.toggle(request)
    assert response.data['data']['action'] == 'removed'
    assert response.data['data']['reaction_type'] is None
    print("Toggle Reaction (Remove) SUCCESS!")
    
    # Cleanup
    user1.delete()
    user2.delete()
    # Room and Message will be deleted by CASCADE if applicable, otherwise:
    try:
        message.delete()
        room.delete()
    except:
        pass

if __name__ == '__main__':
    try:
        test_message_reactions()
        print("\nAll Reaction Verifications PASSED!")
    except Exception as e:
        print(f"Verification FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        # Ensure cleanup even if fails
        User.objects.filter(username__in=['react_user1', 'react_user2']).delete()
