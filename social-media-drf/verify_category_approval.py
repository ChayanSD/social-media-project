import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.contrib.auth import get_user_model
from interest.models import Category, SubCategory
from rest_framework.test import APIClient
from django.urls import reverse

User = get_user_model()

def verify_category_approval_flow():
    client = APIClient()
    
    # 1. Create users
    admin_user, _ = User.objects.get_or_create(username='admin_test', defaults={'email': 'admin_test@example.com', 'is_staff': True, 'is_superuser': True})
    regular_user, _ = User.objects.get_or_create(username='user_test', defaults={'email': 'user_test@example.com'})
    
    # Ensure they have password and status
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    
    # 2. Propose a category as regular user
    client.force_authenticate(user=regular_user)
    print("Proposing category as regular user...")
    response = client.post('/api/categories/', {'name': 'New Tech Proposed'})
    assert response.status_code == 201, f"Failed to propose category: {response.data}"
    category_id = response.data['data']['id']
    print(f"Category proposed with ID: {category_id}")
    
    # 3. Verify it's NOT visible to regular user in list
    print("Verifying category is NOT in the public list...")
    response = client.get('/api/categories/')
    assert response.status_code == 200
    category_names = [c['name'] for c in response.data['data']]
    assert 'New Tech Proposed' not in category_names, "Unapproved category visible in public list!"
    print("Success: Category is hidden from public list.")
    
    # 4. Verify it IS visible to admin
    client.force_authenticate(user=admin_user)
    print("Verifying category IS visible to admin...")
    response = client.get('/api/categories/')
    assert response.status_code == 200
    category_names = [c['name'] for c in response.data['data']]
    assert 'New Tech Proposed' in category_names, "Unapproved category NOT visible to admin!"
    print("Success: Category is visible to admin.")
    
    # 5. Approve as admin
    print("Approving category as admin...")
    response = client.post(f'/api/categories/{category_id}/approve/')
    assert response.status_code == 200, f"Failed to approve category: {response.data}"
    print("Success: Category approved.")
    
    # 6. Verify it's now visible to everyone
    client.force_authenticate(user=regular_user)
    print("Verifying category IS now visible to regular user...")
    response = client.get('/api/categories/')
    assert response.status_code == 200
    category_names = [c['name'] for c in response.data['data']]
    assert 'New Tech Proposed' in category_names, "Approved category NOT visible in public list!"
    print("Success: Category is now public.")

    # 7. Cleanup
    Category.objects.filter(name='New Tech Proposed').delete()
    print("Cleanup complete.")

if __name__ == "__main__":
    try:
        verify_category_approval_flow()
        print("\nALL VERIFICATION STEPS PASSED!")
    except Exception as e:
        print(f"\nVERIFICATION FAILED: {str(e)}")
        sys.exit(1)
