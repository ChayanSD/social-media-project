#!/bin/bash
# =============================================================================
# Django Entrypoint Script
# Handles database migrations and static file collection on container start
# =============================================================================

set -e

# Function to wait for PostgreSQL
wait_for_postgres() {
    echo "Waiting for PostgreSQL..."
    while ! python -c "
import os
import psycopg2
try:
    conn = psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'social_media'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', ''),
        host=os.environ.get('DB_HOST', 'db'),
        port=os.environ.get('DB_PORT', '5432'),
    )
    conn.close()
except:
    exit(1)
" 2>/dev/null; do
        echo "PostgreSQL is unavailable - sleeping..."
        sleep 2
    done
    echo "PostgreSQL is up!"
}

# Wait for database
wait_for_postgres

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if not exists (optional - uses env vars)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput || true
fi

echo "Starting server..."

# Start daphne for ASGI (supports WebSockets)
exec daphne -b 0.0.0.0 -p 8000 app.asgi:application
