from fastapi.testclient import TestClient
from app.main import app


def test_root_returns_message() -> None:
    client = TestClient(app)
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Fathom ASMT API is running"}


def test_ping_returns_pong() -> None:
    client = TestClient(app)
    response = client.get("/ping")

    assert response.status_code == 200
    assert response.json() == {"status": "pong"}
