#!/bin/sh
set -e

echo "Starting FastAPI (Uvicorn)..."
uvicorn src.main:app --host 0.0.0.0 --port 80 --workers 4 &

echo "Starting Celery worker..."
celery -A src.celery_app worker --loglevel INFO --concurrency 4 &

trap "echo 'Shutting down...'; kill -TERM 0" SIGTERM SIGINT

wait
