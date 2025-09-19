import asyncio
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def sort(self, *args, **kwargs):
        return self

    def __aiter__(self):
        async def gen():
            for d in self._docs:
                yield d
        return gen()


class FakeCollection:
    def __init__(self):
        self._docs = []

    def find(self, *args, **kwargs):
        return FakeCursor(list(self._docs))

    async def insert_one(self, doc):
        self._docs.append(doc)


class FakeDB:
    def __init__(self):
        self.habits = FakeCollection()

    async def command(self, name):
        if name != "ping":
            raise ValueError("unsupported command")


def setup_fake_db():
    app.state.db = FakeDB()


def test_habits_get_empty():
    with TestClient(app) as client:
        # Ensure our fake DB is set after app startup
        setup_fake_db()
        r = client.get("/api/habits")
        assert r.status_code == 200
        assert r.json() == []


def test_habits_post_and_get():
    with TestClient(app) as client:
        setup_fake_db()
        # create
        r = client.post("/api/habits", json={"name": "Test Habit", "notes": "n"})
        assert r.status_code == 200
        created = r.json()
        assert created["name"] == "Test Habit"
        assert "createdAt" in created
        # list
        r2 = client.get("/api/habits")
        assert r2.status_code == 200
        lst = r2.json()
        assert len(lst) == 1
        assert lst[0]["name"] == "Test Habit"
