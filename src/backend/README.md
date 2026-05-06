# Fathom ASMT API

This folder contains a FastAPI application for the Fathom assessment project.

## Setup

```bash
uv sync
```

## Run

```bash
# Development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using virtual environment directly
& ".\.venv\Scripts\activate.ps1"
& ".\.venv\Scripts\uvicorn.exe" app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the convenience scripts
.\run-dev.bat    # Windows batch file
.\run-dev.ps1    # PowerShell script
```

## Test

```bash
uv run pytest tests/
```

```bash
pip install pytest httpx
pytest
```
