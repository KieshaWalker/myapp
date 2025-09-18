# Python Backend (FastAPI)

Dev server:

```zsh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then fill in values
uvicorn app.main:app --reload --port 8000
```

Env vars (.env or system):
- `NUTRITIONIX_APP_ID`
- `NUTRITIONIX_API_KEY`
 - `MONGODB_URI` (MongoDB Atlas connection string)
 - `MONGODB_DB` (optional, defaults to `myapp`)
 - `ALLOWED_ORIGINS` (comma-separated list; set to your frontend origin in production)

API:
- `GET /api/health` → `{ status: "ok" }`
- `GET /api/nutrition?food=banana` → Nutritionix proxy
 - `GET /api/db/health` → ping DB status
 - `GET /api/habits` → list habits
 - `POST /api/habits` → create habit `{ name, notes? }`

Serving the React build from FastAPI:

```zsh
chmod +x ../scripts/build_frontend.sh
../scripts/build_frontend.sh

# Then run the API as usual; it will serve index.html at /
uvicorn app.main:app --reload --port 8000
```
