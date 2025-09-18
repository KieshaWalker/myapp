# Data

Backups:
- Use MongoDB Atlas backup/snapshots. Schedule daily backups.
- Export: `mongodump` against your cluster for manual backups.

Restore:
- Use Atlas restore or `mongorestore` to a target cluster.

Seed data:
- A simple seed script is provided at `python-backend/scripts/seed.py`.
- Run it with `python python-backend/scripts/seed.py` after setting `MONGODB_URI`.

PII handling:
- Store only necessary data.
- Do not log secrets or sensitive payloads.
- Use least-privilege DB users and rotate credentials.

Migrations:
- Prefer forward-only migrations and keep scripts in VCS.
- For schema-like constraints, consider validating at the API layer.
