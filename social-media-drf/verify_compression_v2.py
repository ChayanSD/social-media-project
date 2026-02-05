import os
import django
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import User, Profile
from community.models import Community
from accounts.serializers import ProfileUpdateSerializer
from community.serializers import CommunitySerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def create_test_image(filename='test.jpg'):
    file = BytesIO()
    image = Image.new('RGB', (100, 100), color='red')
    image.save(file, format='JPEG')
    file.seek(0)
    return InMemoryUploadedFile(file, None, filename, 'image/jpeg', len(file.getvalue()), None)

def test_profile_compression():
    print("Testing Profile Compression...")
    user = User.objects.create(username='test_comp_user', email='test_comp@example.com')
    profile = user.profile
    
    avatar = create_test_image('avatar.jpg')
    cover = create_test_image('cover.jpg')
    
    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = user
    
    serializer = ProfileUpdateSerializer(instance=profile, data={
        'avatar': avatar,
        'cover_photo': cover
    }, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        profile.refresh_from_db()
        
        print(f"Avatar path: {profile.avatar.name}")
        print(f"Cover path: {profile.cover_photo.name}")
        
        assert profile.avatar.name.endswith('.webp')
        assert profile.cover_photo.name.endswith('.webp')
        print("Profile Compression SUCCESS!")
    else:
        print(f"Profile Serializer ERRORS: {serializer.errors}")

    user.delete()

def test_community_compression():
    print("\nTesting Community Compression...")
    user = User.objects.create(username='comm_comp_user', email='comm_comp@example.com')
    
    profile_img = create_test_image('comm_profile.jpg')
    cover_img = create_test_image('comm_cover.jpg')
    
    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = user
    
    serializer = CommunitySerializer(data={
        'name': 'test-comp-comm',
        'title': 'Test Compression Community',
        'profile_image': profile_img,
        'cover_image': cover_img
    }, context={'request': request})
    
    if serializer.is_valid():
        community = serializer.save()
        
        print(f"Profile Image path: {community.profile_image.name}")
        print(f"Cover Image path: {community.cover_image.name}")
        
        assert community.profile_image.name.endswith('.webp')
        assert community.cover_image.name.endswith('.webp')
        print("Community Compression SUCCESS!")
        community.delete()
    else:
        print(f"Community Serializer ERRORS: {serializer.errors}")

    user.delete()

if __name__ == '__main__':
    try:
        test_profile_compression()
        test_community_compression()
    except Exception as e:
        print(f"Verification FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
