import os
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from app import redis_config


class RedisConfigTests(SimpleTestCase):
    def tearDown(self):
        redis_config.get_redis_client.cache_clear()
        super().tearDown()

    def test_cache_uses_local_memory_when_redis_url_is_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            cache_settings = redis_config.get_cache_settings()

        self.assertEqual(
            cache_settings["default"]["BACKEND"],
            "django.core.cache.backends.locmem.LocMemCache",
        )

    def test_cache_uses_redis_when_redis_url_is_present(self):
        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379/0"}, clear=True):
            cache_settings = redis_config.get_cache_settings()

        self.assertEqual(
            cache_settings["default"]["BACKEND"],
            "django.core.cache.backends.redis.RedisCache",
        )
        self.assertEqual(
            cache_settings["default"]["LOCATION"],
            "redis://localhost:6379/0",
        )

    def test_channel_layers_require_redis_url_when_enabled(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ImproperlyConfigured):
                redis_config.get_channel_layer_settings(True)

    def test_use_redis_channels_defaults_to_false(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(redis_config.use_redis_channels())

    def test_use_redis_channels_reads_env_flag(self):
        with patch.dict(os.environ, {"USE_REDIS_CHANNELS": "True"}, clear=True):
            self.assertTrue(redis_config.use_redis_channels())

    def test_usage_summary_without_redis(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(
                redis_config.get_redis_usage_summary(),
                "cache=local-memory, channel_layers=in-memory",
            )

    def test_usage_summary_with_redis_and_redis_channels(self):
        with patch.dict(
            os.environ,
            {
                "REDIS_URL": "redis://localhost:6379/0",
                "USE_REDIS_CHANNELS": "True",
            },
            clear=True,
        ):
            self.assertEqual(
                redis_config.get_redis_usage_summary(),
                "cache=redis, channel_layers=redis",
            )

    def test_redis_client_is_created_from_redis_url(self):
        redis_config.get_redis_client.cache_clear()

        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379/0"}, clear=True):
            with patch("app.redis_config.redis.Redis.from_url") as from_url:
                client = redis_config.get_redis_client()

        self.assertEqual(client, from_url.return_value)
        from_url.assert_called_once_with(
            "redis://localhost:6379/0",
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30,
        )

    def test_startup_logging_skips_runserver_parent_process(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.redis_config.sys.argv", ["manage.py", "runserver"]):
                self.assertFalse(redis_config.should_log_redis_status_on_startup())

    def test_startup_logging_runs_for_runserver_worker_process(self):
        with patch.dict(os.environ, {"RUN_MAIN": "true"}, clear=True):
            with patch("app.redis_config.sys.argv", ["manage.py", "runserver"]):
                self.assertTrue(redis_config.should_log_redis_status_on_startup())
