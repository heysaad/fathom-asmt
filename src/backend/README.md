# Fathom ASMT API

This folder contains a FastAPI application for the Fathom assessment project.

## Setup

```bash
uv sync
uv run fastapi dev app/main.py
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
