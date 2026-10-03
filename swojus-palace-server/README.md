# Swojus Palace Server

Minimal Express + MongoDB backend for Swojus Palace.

Getting started

- Copy `.env.example` to `.env` and adjust values (especially `JWT_SECRET` and `MONGO_URI`).
- Install dependencies:

```bash
cd swojus-palace-server
npm install
```

- Seed admin user (optional):

```bash
npm run seed-admin
```

- Start server:

```bash
npm run dev
```

API endpoints (basic)

- `POST /api/auth/login` — { email, password } → { token }
- `GET /api/events` — list (auth required)
- `POST /api/events` — create (auth required) — managers and admins
- `PUT /api/events/:id` — update (admin only)
- `POST /api/events/:id/checkin` — set issued counts
- `POST /api/events/:id/checkout` — set returned counts and complete
- `GET /api/muhurt` — list (auth)
- `POST /api/muhurt` — create (admin)
