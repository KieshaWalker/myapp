# Deploy

## API (FastAPI → Heroku)

Initial setup:
```zsh
heroku create showup-api
heroku git:remote -a showup-api -r heroku-api
```

Deploy (monorepo subtree):
```zsh
git subtree push --prefix python-backend heroku-api main
```

Config vars:
```zsh
heroku config:set -a showup-api MONGODB_URI='...'
heroku config:set -a showup-api MONGODB_DB='myapp'
heroku config:set -a showup-api NUTRITIONIX_APP_ID='...'
heroku config:set -a showup-api NUTRITIONIX_API_KEY='...'
# After SPA is live
heroku config:set -a showup-api ALLOWED_ORIGINS='https://your-app.netlify.app,https://yourdomain.com'
```

## SPA (React → Netlify/Vercel)

Netlify:
- Build: `npm ci && npm run build`
- Publish: `dist`
- Env: `VITE_API_BASE=https://showup-api.herokuapp.com`

Vercel:
- Preset: Vite
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE=https://showup-api.herokuapp.com`

Custom domains: point `app.yourdomain.com` to SPA, `api.yourdomain.com` to Heroku API.
