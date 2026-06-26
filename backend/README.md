# Backend — FastAPI

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Docs at http://localhost:8000/docs. First boot seeds an admin user (`ADMIN_USER`/`ADMIN_PASS`) and a few demo locations.

## Routes

- `POST /auth/login` — OAuth2 password flow → JWT bearer
- `GET/POST/PUT/DELETE /staff`
- `GET/POST/PUT/DELETE /locations`
- `GET/POST/PUT/DELETE /assignments`
- `GET /assignments/matrix` — matrix view payload

All mutations require `role=admin`. Reads require authentication.
