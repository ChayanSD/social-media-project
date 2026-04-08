from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Profile


User = get_user_model()


class AuthCookieSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.password = "StrongPass123!"
        self.user = User.objects.create_user(
            username="cookieuser",
            email="cookieuser@example.com",
            password=self.password,
            email_verified=True,
            username_set=True,
        )
        Profile.objects.get_or_create(user=self.user)

    def login(self, remember_me):
        return self.client.post(
            "/auth/login/",
            {
                "email_or_username": self.user.username,
                "password": self.password,
                "remember_me": remember_me,
            },
        )

    def test_login_sets_csrf_cookie(self):
        response = self.login(remember_me=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("csrftoken", response.cookies)

    def test_login_without_remember_me_uses_session_cookies(self):
        response = self.login(remember_me=False)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.cookies[settings.AUTH_COOKIE_ACCESS]["max-age"], "")
        self.assertEqual(response.cookies[settings.AUTH_COOKIE_REFRESH]["max-age"], "")

    def test_login_with_remember_me_uses_persistent_cookies(self):
        response = self.login(remember_me=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            int(response.cookies[settings.AUTH_COOKIE_ACCESS]["max-age"]),
            settings.AUTH_COOKIE_ACCESS_MAX_AGE,
        )
        self.assertEqual(
            int(response.cookies[settings.AUTH_COOKIE_REFRESH]["max-age"]),
            settings.AUTH_COOKIE_REFRESH_MAX_AGE,
        )

    def test_cookie_authenticated_write_requires_csrf_token(self):
        login_response = self.login(remember_me=True)

        self.assertEqual(login_response.status_code, 200)

        response = self.client.patch(
            "/auth/user-profiles/update_me/",
            {"display_name": "Updated Name"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_cookie_authenticated_write_succeeds_with_csrf_token(self):
        login_response = self.login(remember_me=True)

        self.assertEqual(login_response.status_code, 200)
        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.patch(
            "/auth/user-profiles/update_me/",
            {"display_name": "Updated Name"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 200)

    def test_refresh_keeps_session_cookie_behavior(self):
        login_response = self.login(remember_me=False)

        self.assertEqual(login_response.status_code, 200)
        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            "/auth/token/refresh/",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.cookies[settings.AUTH_COOKIE_ACCESS]["max-age"], "")
