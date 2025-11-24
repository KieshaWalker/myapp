# myapp

## Quickstart: Run everything locally

This project uses a separate FastAPI API and a CDN-hosted React SPA. For local development, run them side by side in two terminals.

Terminal 1 — Backend API (FastAPI)

```zsh
cd python-backendls

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create local env file (see docs/ENV_VARS.md for details)
cat > .env <<'EOF'
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
MONGODB_DB=myapp
NUTRITIONIX_APP_ID=<your-app-id>
NUTRITIONIX_API_KEY=<your-api-key>
ALLOWED_ORIGINS=*
EOF

# Run API on port 8000
uvicorn app.main:app --reload --port 8000
```

Smoke test (new shell):

```zsh
curl -s http://localhost:8000/api/health | jq .
curl -s http://localhost:8000/api/db/health | jq .
```

Terminal 2 — Frontend SPA (React + Vite)

```zsh
cd frontend
npm install
echo 'VITE_API_BASE=http://localhost:8000' > .env
npm run dev
```

Open http://localhost:5173 and exercise the UI. The SPA will call the API at http://localhost:8000.

Note: The SPA includes simple Habitica testing controls (load tasks and score a selected task) when HABITICA_* env vars are set on the API.

Optional checks:

```zsh
# Habits API
curl -s http://localhost:8000/api/habits | jq .
curl -s -X POST http://localhost:8000/api/habits \
	-H 'Content-Type: application/json' \
	-d '{"name":"Drink water","notes":"8 cups"}' | jq .

# Nutrition API (requires Nutritionix env)
curl -s 'http://localhost:8000/api/nutrition?food=banana' | jq .

# Habitica (optional: set HABITICA_* in python-backend/.env)
curl -s 'http://localhost:8000/api/habitica/tasks?type=habits' | jq .
# Score a habit up (replace TASK_ID)
curl -s -X POST 'http://localhost:8000/api/habitica/tasks/TASK_ID/score' \
	-H 'Content-Type: application/json' \
	-d '{"direction":"up"}' | jq .
```

If you prefer serving the SPA from FastAPI for local tests, build and copy it:

```zsh
chmod +x scripts/build_frontend.sh
./scripts/build_frontend.sh
# Restart the API and open http://localhost:8000
```

## Deploying to Heroku (Node app)

Prereqs:
- Heroku CLI installed
- A Heroku app named `showup` in your Heroku account

From the project root (`/home/kieshawalk/selfcoder/showUp`):

```zsh
# 1) Login (opens browser)
heroku login

# 2) Connect to the existing app named `showup`
heroku git:remote -a showup

# 3) Commit any new files (e.g., Procfile)
git add Procfile
git commit -m "Add Heroku Procfile" || true

# 4) Deploy (if your default branch is main)
git push heroku main
# If your default branch is master instead:
# git push heroku master

# 5) Set required config vars
heroku config:set MONGODB_URI='your-mongodb-connection-string'
heroku config:set SESSION_SECRET='a-long-random-secret'
heroku config:set HABITICA_USER_ID='...'
heroku config:set HABITICA_API_TOKEN='...'
heroku config:set NUTRITIONIX_APP_ID='...'
heroku config:set NUTRITIONIX_API_KEY='...'
# Optional overrides:
# heroku config:set HABITICA_CLIENT='myapp-prod'
# heroku config:set HABITICA_API_BASE='https://habitica.com/api/v3'

# 6) Verify logs and open the app
heroku logs --tail
heroku open
```

Notes (Node app):
- This repo includes a `Procfile` with `web: node server.js` and a `start` script in `package.json`.
- The server reads `process.env.PORT` (required by Heroku) and `MONGODB_URI` for MongoDB.
- `.env` is ignored by git; set all secrets in Heroku Config Vars.
 - `.env` is ignored by git; set all secrets in Heroku Config Vars.
 - Heroku dyno filesystems are ephemeral: anything written to disk (e.g., `uploads/`) is lost on restart. Use cloud storage (S3, etc.).

---

## Recommended production architecture: Separate SPA + API

Overview:
- Frontend: React SPA hosted on a CDN/static host (Netlify or Vercel). No server-side code.
- Backend: FastAPI deployed separately (Heroku app or other compute). Provides `/api/*`.

Benefits:
- Industry-standard SPA + API separation; easier audits and handoffs.
- Independent scaling, rollbacks, and security hardening.
- CDN edge performance and features (caching, WAF, analytics).

Acquisition-ready rationale (summary):
- Industry-standard architecture buyers expect.
- Easier to audit and replatform (CDN for SPA, any compute for API).
- Independent scaling/rollbacks reduce risk during handover.
- Better performance/security posture via CDN/WAF and clean auth models.
- Clearer ownership boundaries across teams.

See docs/ARCHITECTURE.md for details.

Deploy steps

1) Deploy the API (FastAPI)
- Use the Heroku instructions above for `showup-api`.
- Configure env vars: `MONGODB_URI`, `MONGODB_DB`, `NUTRITIONIX_*`, and set `ALLOWED_ORIGINS` to the frontend origin once it’s live (e.g., `https://app.example.com`).

2) Deploy the SPA (React)

Netlify:
```zsh
# In frontend/
npm install
npm run build
# Drag-and-drop the frontend/dist folder to Netlify, or connect repo and set build command:
#   Build command: npm ci && npm run build
#   Publish directory: dist
# Set env var VITE_API_BASE to your API URL (e.g., https://showup-api.herokuapp.com)
```

Vercel:
```zsh
# In frontend/
vercel init  # or use the Vercel UI to import the frontend folder
# Framework preset: Vite
# Build command: npm run build
# Output: dist
# Add env VITE_API_BASE=https://showup-api.herokuapp.com
```

3) Configure CORS on the API
- Set `ALLOWED_ORIGINS` on the API to your SPA origin (comma-separated for multiple):
```zsh
heroku config:set -a showup-api ALLOWED_ORIGINS='https://your-app.netlify.app,https://yourdomain.com'
```

4) Point the SPA to the API
- In `frontend/.env` for local dev: `VITE_API_BASE=http://localhost:8000`
- In production (Netlify/Vercel env): `VITE_API_BASE=https://showup-api.herokuapp.com`

5) Optional: Custom domains and HTTPS
- Add a custom domain to Netlify/Vercel and to Heroku. Use `api.yourdomain.com` for API and `app.yourdomain.com` for SPA.

Security notes
- Never commit `.env` with secrets. Set env vars in Heroku/Netlify/Vercel dashboards.
- Rotate any credentials that were exposed during development.
- Consider adding rate limiting and authentication (JWT or cookie) on the API.

## Deploying the Python API (FastAPI) on Heroku (monorepo)

Because this repository is a monorepo, deploy the Python API in `python-backend/` as a separate Heroku app. You cannot run Node and Python servers in a single Heroku web dyno for one app.

App name examples:
- API: `showup-api`

1) Create the Heroku app and remote
```zsh
heroku create showup-api
heroku git:remote -a showup-api -r heroku-api
```

2) Add a Procfile in the Python subdirectory (one-time)
Create `python-backend/Procfile` with:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

3) Deploy the subdirectory using git subtree
```zsh
# From the repo root
git add python-backend/Procfile || true
git commit -m "Add Procfile for Python API" || true
git subtree push --prefix python-backend heroku-api main
```

4) Configure environment variables for the API
```zsh
heroku config:set -a showup-api NUTRITIONIX_APP_ID='...'
heroku config:set -a showup-api NUTRITIONIX_API_KEY='...'
heroku config:set -a showup-api MONGODB_URI='your-mongodb-connection-string'
heroku config:set -a showup-api MONGODB_DB='myapp'
```

5) Verify and open
```zsh
heroku logs --tail -a showup-api
heroku open -a showup-api
# Health checks
curl -s https://showup-api.herokuapp.com/api/health
curl -s https://showup-api.herokuapp.com/api/db/health
```

Notes:
- Alternative to `git subtree`: use a monorepo buildpack (e.g., `timanovsky/subdir-heroku-buildpack`) and set the subdirectory path; then push `main` normally.
- CORS is currently `*` in development. For production, restrict origins to your frontend URL.

---

## Deploying the React frontend

Option A (recommended): Deploy to a static host (Netlify/Vercel/GitHub Pages) and point it to the Python API URL (e.g., `https://showup-api.herokuapp.com`).

Option B (Heroku): Possible, but you need a static file server or the Heroku static buildpack and a build step.

Heroku (Node server approach) outline:
1) Add a small Node server in `frontend/` to serve `dist/`.
2) Add scripts in `frontend/package.json`:
	 - `heroku-postbuild`: `npm ci && npm run build`
	 - `start`: `node server.js` (your static server)
3) Create `frontend/Procfile` with `web: node server.js` and deploy the `frontend/` subdir using `git subtree push` as above to a new app (e.g., `showup-frontend`).

Static buildpack approach outline:
1) Use a monorepo/subdir buildpack to change directory to `frontend/`.
2) Add the Heroku static buildpack.
3) Provide a `static.json` that points to the built `dist/` folder and a build step to generate it.

Because these require extra files and configuration, hosting React separately on a static host is simpler.

---

## Python-only deployment (serve React build from FastAPI)

If you no longer need the Node app, you can deploy just the Python API and have it serve the React build:

1) Build the React app locally
```zsh
cd frontend
npm install
npm run build
```

2) Copy the React build into the Python app static dir and deploy
```zsh
chmod +x scripts/build_frontend.sh
scripts/build_frontend.sh

# Commit the static assets so Heroku slug has them
git add python-backend/app/static python-backend/Procfile
git commit -m "Build React and include static assets for FastAPI" || true

# Deploy only the python-backend to the showup-api app
git subtree push --prefix python-backend heroku-api main
```

3) Configure API env vars on the Python app (as above) and open the app root URL—FastAPI will serve `index.html` at `/` and the API under `/api/*`.

Notes:
- The build script copies `frontend/dist` into `python-backend/app/static`, which FastAPI serves at `/`.
- Set `ALLOWED_ORIGINS` on Heroku to your frontend origin (or omit when serving from the same domain).

---

## Which parts are not deployable on a single Heroku app?

- You cannot run both the Node server (Express/EJS) and the Python FastAPI server in the same single-dyno Heroku app. Use separate Heroku apps (e.g., `showup` for Node, `showup-api` for Python) or choose one backend.
- Any feature that writes to the local filesystem (e.g., saving uploads under `uploads/`) won’t persist on Heroku. Use a persistent store (S3, etc.).
- Everything else (Nutritionix proxy, Habitica integration, MongoDB access) is deployable as long as you set the correct environment variables.

Environment variables checklist (set per app):

- Common
	- `MONGODB_URI`
	- `SESSION_SECRET` (Node app)

- Habitica (ensure names match the code: `HABITICA_*`, not `HABITCAL_*`)
	- `HABITICA_USER_ID`
	- `HABITICA_API_TOKEN`
	- `HABITICA_API_BASE` (optional, defaults to `https://habitica.com/api/v3`)
	- `HABITICA_CLIENT` (optional)

- Nutritionix
	- `NUTRITIONIX_APP_ID`
	- `NUTRITIONIX_API_KEY`

Security note: Rotate any secrets previously shared publicly and update Heroku config vars accordingly.


## How to run locally

Python API (port 8000):

```zsh
cd python-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # put your Nutritionix credentials here
uvicorn app.main:app --reload --port 8000
```

React app (port 5173):

```zsh
cd frontend
npm install
cp .env.example .env  # keep http://localhost:8000 unless you change API port
npm run dev
```

## Next migration steps (Node → Python/React)

1) Backend (FastAPI)
- Add MongoDB: install `motor` and connect with `MONGODB_URI` on startup.
- Port auth: implement login/register endpoints, choose JWT or cookie sessions.
- Port features: recreate habits/logs endpoints and Habitica proxy in Python (`httpx`).

2) Frontend (React)
- Add React Router and pages: Home, Login/Register, Habits, Logs, Nutrition.
- Replace EJS views by React screens calling Python API.

3) Deployment
- Deploy FastAPI (Render/Fly/Heroku) and serve React as static files (Vite build) or via CDN.
- Keep Node app during transition, switch traffic when Python/React is ready.
