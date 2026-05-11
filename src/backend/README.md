# Fathom ASMT API

This folder contains a FastAPI application for the Fathom assessment project.

## Setup

```bash
uv sync
uv run fastapi dev app/main.py
```

## Seed Data

On first startup, the API seeds demo data if it is missing:

- 5 users with password `admin123`
- 5 ships with sample maintenance tasks and drills

Demo users:

```text
admin@fathom.local
captain@fathom.local
engineer@fathom.local
officer@fathom.local
bosun@fathom.local
```

## Migration

**Add migration**
```
uv run alembic revision --autogenerate -m "<message>"
```

**Run migration**
```
uv run alembic upgrade head
```

## Test

```bash
uv run pytest tests/
```
