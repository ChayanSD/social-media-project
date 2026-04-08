"""Redis configuration helpers shared across Django settings and app code."""

import os
import sys
import logging
from functools import lru_cache

import redis
from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger(__name__)

REDIS_SOCKET_TIMEOUT_SECONDS = 5
LOCAL_CACHE_LOCATION = "social-media-local-cache"
SERVER_START_COMMANDS = {"runserver", "daphne", "gunicorn", "uvicorn"}
_startup_status_logged = False


def get_redis_url(required=False):
    """Return the configured Redis URL.

    A standard Redis URL keeps the code compatible with both hosted Redis
    providers like Upstash and a future self-hosted/container Redis instance.
    """

    redis_url = os.environ.get("REDIS_URL", "").strip()

    if required and not redis_url:
        raise ImproperlyConfigured(
            "REDIS_URL is not set. Add it to the environment before enabling Redis."
        )

    return redis_url


def is_redis_configured():
    """Return True when the project has a Redis URL available."""

    return bool(get_redis_url())


def use_redis_channels():
    """Return True when channel layers should use Redis."""

    return os.environ.get("USE_REDIS_CHANNELS", "False").lower() == "true"


def get_redis_usage_summary():
    """Return a human-readable summary of Redis-backed features."""

    cache_backend = "redis" if is_redis_configured() else "local-memory"
    channel_backend = "redis" if use_redis_channels() else "in-memory"
    return f"cache={cache_backend}, channel_layers={channel_backend}"


def get_cache_settings():
    """Build the Django cache configuration for the current environment."""

    if not is_redis_configured():
        return {
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                "LOCATION": LOCAL_CACHE_LOCATION,
            }
        }

    return {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": get_redis_url(required=True),
            "OPTIONS": {
                "socket_connect_timeout": REDIS_SOCKET_TIMEOUT_SECONDS,
                "socket_timeout": REDIS_SOCKET_TIMEOUT_SECONDS,
                "retry_on_timeout": True,
                "health_check_interval": 30,
            },
        }
    }


def get_channel_layer_settings(use_redis_channels):
    """Build the channel layer configuration for the current environment."""

    if use_redis_channels:
        return {
            "default": {
                "BACKEND": "channels_redis.core.RedisChannelLayer",
                "CONFIG": {
                    "hosts": [get_redis_url(required=True)],
                },
            }
        }

    return {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }


@lru_cache(maxsize=1)
def get_redis_client():
    """Return a shared Redis client created from REDIS_URL."""

    return redis.Redis.from_url(
        get_redis_url(required=True),
        socket_connect_timeout=REDIS_SOCKET_TIMEOUT_SECONDS,
        socket_timeout=REDIS_SOCKET_TIMEOUT_SECONDS,
        retry_on_timeout=True,
        health_check_interval=30,
    )


def should_log_redis_status_on_startup():
    """Return True when the current process is booting the web application."""

    command = os.path.basename(sys.argv[0]) if sys.argv else ""
    args = set(sys.argv[1:])

    if "runserver" in args and os.environ.get("RUN_MAIN") != "true":
        return False

    return command in SERVER_START_COMMANDS or bool(args & SERVER_START_COMMANDS)


def log_redis_status_on_startup():
    """Log Redis connectivity when the web server process starts."""

    global _startup_status_logged

    if _startup_status_logged or not should_log_redis_status_on_startup():
        return

    _startup_status_logged = True

    if not is_redis_configured():
        logger.info(
            "Redis is not configured. %s.",
            get_redis_usage_summary(),
        )
        return

    try:
        client = get_redis_client()
        client.ping()
    except redis.RedisError as exc:
        logger.warning(
            "Redis connection failed for REDIS_URL. %s. Error: %s",
            get_redis_usage_summary(),
            exc,
        )
        return

    logger.info(
        "Redis connected successfully using REDIS_URL. %s.",
        get_redis_usage_summary(),
    )
