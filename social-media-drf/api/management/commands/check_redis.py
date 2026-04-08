import redis
from django.core.management.base import BaseCommand, CommandError

from app.redis_config import get_redis_client, is_redis_configured


class Command(BaseCommand):
    help = "Verify Redis connectivity using REDIS_URL with ping, set, and get."

    def add_arguments(self, parser):
        parser.add_argument(
            "--key",
            default="redis:smoke-test",
            help="Temporary key used for the round-trip check.",
        )
        parser.add_argument(
            "--value",
            default="ok",
            help="Temporary value written during the round-trip check.",
        )
        parser.add_argument(
            "--ttl",
            default=30,
            type=int,
            help="Expiration time in seconds for the temporary key.",
        )

    def handle(self, *args, **options):
        if not is_redis_configured():
            raise CommandError("REDIS_URL is not set.")

        client = get_redis_client()
        key = options["key"]
        value = options["value"]
        ttl = options["ttl"]
        expected_value = value.encode("utf-8")

        try:
            if not client.ping():
                raise CommandError("Redis ping returned a falsy response.")

            client.set(key, value, ex=ttl)
            stored_value = client.get(key)
        except redis.RedisError as exc:
            raise CommandError(f"Redis check failed: {exc}") from exc
        finally:
            try:
                client.delete(key)
            except redis.RedisError:
                pass

        if stored_value != expected_value:
            raise CommandError(
                f"Redis round-trip mismatch. Expected {expected_value!r}, got {stored_value!r}."
            )

        self.stdout.write(
            self.style.SUCCESS("Redis is reachable and the set/get round-trip succeeded.")
        )
