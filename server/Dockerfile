FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy lock file and pyproject.toml
COPY pyproject.toml uv.lock ./

# Sync dependencies from lock file
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

EXPOSE 8000