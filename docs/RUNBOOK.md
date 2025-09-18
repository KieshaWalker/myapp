# Runbook

Quick commands:

Local API:
```zsh
cd python-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Local SPA:
```zsh
cd frontend
npm install
cp .env.example .env  # VITE_API_BASE=http://localhost:8000
npm run dev
```

Common checks:
- API health: `GET /api/health`
- DB health: `GET /api/db/health`
- Nutrition test: `GET /api/nutrition?food=banana`

Incidents:
- 5xx from API: check Heroku logs, validate env vars.
- DB errors: verify `MONGODB_URI`, Atlas IP allowlist, user roles.
- CORS errors: set `ALLOWED_ORIGINS` to the SPA origin(s).
