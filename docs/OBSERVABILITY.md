# Observability

Health checks:
- `GET /api/health` – liveness
- `GET /api/db/health` – DB ping

Uptime monitoring:
- Use UptimeRobot or BetterStack to monitor API endpoint and SPA URL.
- Alert channels: email + Slack.

Logs & metrics:
- Heroku logs: `heroku logs --tail -a showup-api`
- Consider enabling an add-on for logs/metrics (e.g., Papertrail, LogDNA).

OpenAPI docs:
- FastAPI provides docs at `/docs` (Swagger UI) and `/redoc`.
- Ensure title/description/version are set for clarity.
