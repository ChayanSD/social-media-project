from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserModerationStatusViewSet

router = DefaultRouter()
router.register(r"moderation", UserModerationStatusViewSet, basename="moderation")

urlpatterns = [
    path("", include(router.urls)),
]
