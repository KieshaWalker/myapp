# Environment Variables

Backend (FastAPI):
- `MONGODB_URI` – MongoDB Atlas connection string
- `MONGODB_DB` – Database name (default: `myapp`)
- `NUTRITIONIX_APP_ID` – Nutritionix app id
- `NUTRITIONIX_API_KEY` – Nutritionix api key
- `ALLOWED_ORIGINS` – Comma-separated list of allowed SPA origins (e.g., `https://app.example.com`)
- Optional Habitica (align to your code):
  - `HABITICA_USER_ID`
  - `HABITICA_API_TOKEN`
  - `HABITICA_API_BASE` (default `https://habitica.com/api/v3`)
  - `HABITICA_CLIENT`

Frontend (React):
- `VITE_API_BASE` – Base URL of API (local: `http://localhost:8000`, prod: `https://showup-api.herokuapp.com`)

Secrets management:
- Never commit `.env` files. Use Heroku/Netlify/Vercel dashboards.
- Rotate exposed keys immediately.
