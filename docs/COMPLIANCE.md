# Compliance & Licensing

Third-party licenses:
- Keep `package.json` and `requirements.txt` up to date.
- Use `npm ls --license` and `pip-licenses` (optional) to review.

API key rotation:
- Maintain keys in provider dashboards.
- Rotate on leakage or every 90 days; update Heroku/Netlify/Vercel envs.

GDPR/CCPA basics (if applicable):
- Provide a privacy policy describing data usage.
- Support data subject requests: export/delete user data upon request.
- Minimize PII; encrypt secrets; avoid logging PII.
