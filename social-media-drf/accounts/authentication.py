from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions
from django.conf import settings

import logging
logger = logging.getLogger(__name__)

class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that prioritizes reading the access token
    from HttpOnly cookies, but falls back to the Authorization header.
    """
    def enforce_csrf(self, request):
        """Apply DRF-style CSRF validation for cookie-authenticated requests."""
        check = CSRFCheck(lambda request: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            logger.warning(f"CSRF Failed for path {request.path}: {reason}")
            raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")
        logger.info(f"CSRF Passed for path {request.path}")

    def authenticate(self, request):
        header = self.get_header(request)
        
        if header is None:
            # Look for token in cookies if header is missing
            logger.info(f"Authenticating... Cookies found: {list(request.COOKIES.keys())}")
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
            if raw_token:
                logger.info(f"Access cookie '{settings.AUTH_COOKIE_ACCESS}' found.")
            else:
                logger.info(f"Access cookie '{settings.AUTH_COOKIE_ACCESS}' NOT found.")
                return None
            self.enforce_csrf(request)
        else:
            # Standard header-based extraction
            raw_token = self.get_raw_token(header)
            
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            if user:
                logger.info(f"Succesfully authenticated user {user.username} via {settings.AUTH_COOKIE_ACCESS}")
            return user, validated_token
        except Exception as e:
            logger.error(f"Authentication failed for {settings.AUTH_COOKIE_ACCESS}: {str(e)}")
            return None
