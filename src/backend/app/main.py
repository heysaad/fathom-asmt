from fastapi import FastAPI

app = FastAPI(title="Fathom ASMT API", version="0.1.0")


@app.get("/", summary="Health check")
def root() -> dict[str, str]:
    return {"message": "Fathom ASMT API is running"}


@app.get("/ping", summary="Ping endpoint")
def ping() -> dict[str, str]:
    return {"status": "pong"}
