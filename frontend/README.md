# React Frontend

Quick start (Vite):

```zsh
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```

During development, set the API base (e.g., http://localhost:8000) in an `.env` file as `VITE_API_BASE`.

## Deploying to a CDN (Netlify/Vercel)

Netlify
1. In the Netlify UI, create a new site from your repo and choose the `frontend/` folder as the base.
2. Build settings:
	- Build command: `npm ci && npm run build`
	- Publish directory: `dist`
3. Environment variable:
	- `VITE_API_BASE=https://your-api.example.com` (e.g., your Heroku FastAPI URL)
4. Deploy. After deploy, update your API’s `ALLOWED_ORIGINS` to the Netlify domain and your custom domain.

Vercel
1. Import project in Vercel, selecting the `frontend/` directory.
2. Framework preset: `Vite`.
3. Build command: `npm run build`; Output directory: `dist`.
4. Environment variable:
	- `VITE_API_BASE=https://your-api.example.com`
5. Deploy. Update the API’s `ALLOWED_ORIGINS` to the Vercel domain and your custom domain.

Local vs Production envs
- Local: `VITE_API_BASE=http://localhost:8000`
- Prod: `VITE_API_BASE=https://<your-api-host>`
