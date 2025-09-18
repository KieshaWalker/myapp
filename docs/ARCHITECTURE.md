# Architecture

High-level design:

```
+-------------------+         HTTPS          +------------------------------+
|  React SPA (CDN)  |  <------------------>  |  FastAPI (Heroku or compute) |
|  Netlify/Vercel   |      API requests      |  /api/*, MongoDB, 3rd APIs   |
+-------------------+                        +------------------------------+
                                                    |
                                                    | MongoDB URI
                                                    v
                                              MongoDB Atlas
```

- Frontend: React SPA built with Vite, hosted on a CDN/static platform (Netlify or Vercel).
- Backend: Python FastAPI app serving JSON APIs under `/api/*`.
- Database: MongoDB Atlas via the `motor` async driver.
- Third-party APIs: Nutritionix, Habitica.
- CORS: Restricted to the SPA origin(s) in production via `ALLOWED_ORIGINS`.

Key endpoints:
- `GET /api/health` – API liveness
- `GET /api/db/health` – Database connectivity
- `GET /api/nutrition?food=...` – Nutritionix proxy
- `GET/POST /api/habits` – Sample habits
- `GET /api/habitica/tasks` – List Habitica tasks for the configured user
- `POST /api/habitica/tasks/{taskId}/score` – Score a Habitica task (direction `up` or `down`)

## Why SPA + API separation (acquisition-ready)

- Industry-standard architecture: SPA + API separation is what most acquirers expect.
- Easier to audit and replatform: Frontend can move to any static host/CDN; API can move to any compute (Heroku, AWS, GCP, k8s).
- Independent scaling and rollbacks: Reduces operational risk during and after handover.
- Better performance and security posture: CDN edge caching, WAF/CDN features, cleaner cookie/auth models supported by buyers’ infra.
- Clearer ownership boundaries: Different teams can own frontend and backend separately.
