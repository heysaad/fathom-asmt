# fathom-asmt

## Docker Compose

Run the full app with Postgres from the repository root:

```bash
docker compose up --build
```

This starts:

App | Url
-- | --
Frontend | http://localhost:3000
API | http://localhost:8000
Postgres | localhost:5432

## Local setup

1. clone `/src/backend/.env.example` to `/src/backend/.env`
2. change connection string
3. run backend
   ```
   cd ./src/backend/
   uv sync
   uv run alembic upgrade head
   uv run fastapi dev app/main.py
   ```
4. run frontend
   ```
   cd ./src/fathom-frontend/
   npm i
   npm run dev
   ```