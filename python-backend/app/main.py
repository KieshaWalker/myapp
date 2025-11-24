from fastapi import FastAPI, HTTPException, Body
# Import CORSMiddleware to enable handling of cross-origin requests (CORS) in FastAPI
from fastapi.middleware.cors import CORSMiddleware  # correct
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import httpx
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Any, Dict
from bson import ObjectId
from datetime import datetime

load_dotenv()

APP_ID = os.getenv("NUTRITIONIX_APP_ID")
API_KEY = os.getenv("NUTRITIONIX_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "myapp")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

# SSL verification control (useful for development vs production)
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"

# Create SSL context with proper certificates for production
def get_ssl_verify():
    """Return SSL verification setting for httpx client"""
    if not VERIFY_SSL:
        return False  # Disable verification for dev
    
    # For production, use certifi's certificate bundle
    try:
        return certifi.where()  # Returns path to certificate bundle
    except Exception as e:
        print(f"WARNING: Could not load certificates: {e}")
        # In production, you might want to fail here instead
        return False

# Habitica credentials (global for now; can be per-user in the future)
HABITICA_USER_ID = os.getenv("HABITICA_USER_ID")
HABITICA_API_TOKEN = os.getenv("HABITICA_API_TOKEN")
HABITICA_API_BASE = os.getenv("HABITICA_API_BASE", "https://habitica.com/api/v3")
HABITICA_CLIENT = os.getenv("HABITICA_CLIENT", "showup-api-local")

app = FastAPI(
    title="ShowUp API",
    description="Nutrition, habits, and integrations API for the ShowUp app.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/db/health")
async def db_health():
    if not hasattr(app.state, "db"):
        return {"connected": False, "error": "db not initialized"}
    try:
        await app.state.db.command("ping")
        return {"connected": True, "db": MONGODB_DB}
    except Exception as e:
        return {"connected": False, "error": str(e)}

@app.get("/api/nutrition")
async def nutrition(food: str | None = None):
    if not food:
        raise HTTPException(status_code=400, detail="Missing 'food' query parameter")
    if not APP_ID or not API_KEY:
        raise HTTPException(status_code=500, detail="Nutritionix credentials not configured")
    try:
        async with httpx.AsyncClient(timeout=30, verify=get_ssl_verify()) as client:
            r = await client.post(
                "https://trackapi.nutritionix.com/v2/natural/nutrients",
                json={"query": food},
                headers={
                    "x-app-id": APP_ID,
                    "x-app-key": API_KEY,
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Habitica proxy endpoints ---
def habitica_headers() -> Dict[str, str]:
    if not HABITICA_USER_ID or not HABITICA_API_TOKEN:
        raise HTTPException(status_code=500, detail="Habitica credentials not configured")
    return {
        "x-api-user": HABITICA_USER_ID,
        "x-api-key": HABITICA_API_TOKEN,
        "x-client": HABITICA_CLIENT,
        "Content-Type": "application/json",
    }


@app.get("/api/habitica/tasks")
async def habitica_list_tasks(type: str | None = None):
    # type can be: habits, dailys, todos, rewards (Habitica supports filtering via query)
    headers = habitica_headers()
    url = f"{HABITICA_API_BASE}/tasks/user"
    params = {"type": type} if type else None
    try:
        async with httpx.AsyncClient(timeout=30, verify=get_ssl_verify()) as client:
            r = await client.get(url, headers=headers, params=params)
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/habitica/tasks/{task_id}/score")
async def habitica_score_task(task_id: str, payload: Dict[str, Any] = Body(...)):
    direction = payload.get("direction")
    amount = payload.get("amount")
    if direction not in ("up", "down"):
        raise HTTPException(status_code=400, detail="'direction' must be 'up' or 'down'")
    headers = habitica_headers()
    url = f"{HABITICA_API_BASE}/tasks/{task_id}/score/{direction}"
    body = {"amount": amount} if amount is not None else None
    try:
        async with httpx.AsyncClient(timeout=30, verify=get_ssl_verify()) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MongoDB wiring ---
@app.on_event("startup")
async def on_startup():
    if MONGODB_URI:
        client = AsyncIOMotorClient(MONGODB_URI)
        app.state.mongo = client
        app.state.db = client[MONGODB_DB]
    else:
        # optional: log missing DB, keep API running for nutrition only
        app.state.mongo = None
        app.state.db = None

@app.on_event("shutdown")
async def on_shutdown():
    client: Optional[AsyncIOMotorClient] = getattr(app.state, "mongo", None)
    if client:
        client.close()

# --- Sample Habits API (for migration) ---
@app.get("/api/habits")
async def list_habits():
    if app.state.db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    cursor = app.state.db.habits.find({}, {"_id": 0}).sort("createdAt", -1)
    return [jsonify_mongo(doc) async for doc in cursor]

@app.post("/api/habits")
async def create_habit(payload: Dict[str, Any] = Body(...)):
    if app.state.db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Missing 'name'")
    doc = {
        "name": name,
        "notes": payload.get("notes", ""),
        "createdAt": datetime.utcnow(),
    }
    await app.state.db.habits.insert_one(doc)
    # return without _id for simplicity
    return jsonify_mongo({k: v for k, v in doc.items() if k != "_id"})


def jsonify_mongo(value: Any) -> Any:
    """Recursively convert Mongo types (ObjectId, datetime) to JSON-friendly values."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [jsonify_mongo(v) for v in value]
    if isinstance(value, dict):
        return {k: jsonify_mongo(v) for k, v in value.items()}
    return value

# --- Static file serving for React build (optional) ---
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))

if os.path.isdir(STATIC_DIR):
    # Serve assets from React build
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        return {"message": "Frontend build not found. Run scripts/build_frontend.sh to generate it."}
