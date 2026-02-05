import os
import django
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files.storage import default_storage

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import User, Profile
from community.models import Community
from post.models import Post

def create_test_image(filename='test.jpg'):
    file = BytesIO()
    image = Image.new('RGB', (10, 10), color='blue')
    image.save(file, format='JPEG')
    file.seek(0)
    return InMemoryUploadedFile(file, None, filename, 'image/jpeg', len(file.getvalue()), None)

def test_post_cleanup():
    print("Testing Post Cleanup...")
    user = User.objects.create(username='cleanup_user_post', email='post@cleanup.com')
    
    # Manually save files to simulate post media
    file1 = create_test_image('post1.jpg')
    path1 = default_storage.save('posts/test/post1.webp', file1)
    
    file2 = create_test_image('post2.jpg')
    path2 = default_storage.save('posts/test/post2.webp', file2)
    
    post = Post.objects.create(
        user=user,
        title='Cleanup Test Post',
        post_type='media',
        media_file=[path1, path2]
    )
    
    assert default_storage.exists(path1)
    assert default_storage.exists(path2)
    
    print(f"Post media saved at: {path1}, {path2}")
    
    post.delete()
    
    assert not default_storage.exists(path1)
    assert not default_storage.exists(path2)
    print("Post Cleanup SUCCESS!")
    user.delete()

def test_community_cleanup():
    print("\nTesting Community Cleanup...")
    user = User.objects.create(username='cleanup_user_comm', email='comm@cleanup.com')
    
    community = Community.objects.create(
        name='cleanup-test',
        title='Cleanup Test Community',
        created_by=user,
        profile_image=create_test_image('comm_prof.jpg'),
        cover_image=create_test_image('comm_cover.jpg')
    )
    
    prof_path = community.profile_image.name
    cover_path = community.cover_image.name
    
    assert default_storage.exists(prof_path)
    assert default_storage.exists(cover_path)
    
    print(f"Community images saved at: {prof_path}, {cover_path}")
    
    community.delete()
    
    assert not default_storage.exists(prof_path)
    assert not default_storage.exists(cover_path)
    print("Community Cleanup SUCCESS!")
    user.delete()

def test_profile_cleanup():
    print("\nTesting Profile Cleanup...")
    user = User.objects.create(username='cleanup_user_prof', email='prof@cleanup.com')
    profile = user.profile
    
    profile.avatar = create_test_image('avatar_cleanup.jpg')
    profile.cover_photo = create_test_image('cover_cleanup.jpg')
    profile.save()
    
    avatar_path = profile.avatar.name
    cover_path = profile.cover_photo.name
    
    assert default_storage.exists(avatar_path)
    assert default_storage.exists(cover_path)
    
    print(f"Profile images saved at: {avatar_path}, {cover_path}")
    
    # Deleting user should delete profile via CASCADE, and profile delete should trigger cleanup
    user.delete()
    
    assert not default_storage.exists(avatar_path)
    assert not default_storage.exists(cover_path)
    print("Profile Cleanup SUCCESS!")

if __name__ == '__main__':
    try:
        test_post_cleanup()
        test_community_cleanup()
        test_profile_cleanup()
        print("\nAll Cleanup Verifications PASSED!")
    except Exception as e:
        print(f"Verification FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
