from fastapi.testclient import TestClient
from app.main import app


def test_root_returns_message() -> None:
    client = TestClient(app)
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"app": "Fathom Assessment API", "version": "0.1.0"}


def test_health_returns_healthy() -> None:
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "Healthy"}
