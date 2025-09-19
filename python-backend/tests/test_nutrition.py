from fastapi.testclient import TestClient
from app.main import app


class DummyResponse:
    def __init__(self, json_data, status_code=200):
        self._json = json_data
        self.status_code = status_code

    def json(self):
        return self._json

    def raise_for_status(self):
        # Simulate httpx.Response.raise_for_status no-op for 2xx
        if not (200 <= self.status_code < 400):
            raise AssertionError(f"HTTP error: {self.status_code}")


def test_nutrition_success(monkeypatch):
    # Monkeypatch httpx.AsyncClient.post used by the route
    class DummyClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, **kwargs):
            assert "natural/nutrients" in url
            json = kwargs.get("json")
            assert json and "query" in json
            return DummyResponse({"foods": [{"food_name": "banana", "nf_calories": 89}]})

    import httpx
    # Ensure credentials check passes in the route (these are module-level constants)
    from app import main as main_module
    monkeypatch.setattr(main_module, "APP_ID", "dummy")
    monkeypatch.setattr(main_module, "API_KEY", "dummy")
    monkeypatch.setattr(httpx, "AsyncClient", lambda *args, **kwargs: DummyClient())

    with TestClient(app) as client:
        r = client.get("/api/nutrition", params={"food": "1 banana"})
        assert r.status_code == 200
        body = r.json()
        assert "foods" in body
        assert body["foods"][0]["food_name"] == "banana"
