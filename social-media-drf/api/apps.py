from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from app.redis_config import log_redis_status_on_startup

        log_redis_status_on_startup()
