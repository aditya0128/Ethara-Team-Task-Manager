# ETHARA TEAM TASK MANAGER

Enterprise role-based team productivity platform — projects, tasks, attendance, analytics. Built with **FastAPI + PostgreSQL** (backend) and **React 18 + TypeScript + Vite + Tailwind** (frontend). Production-ready monorepo, Docker-first, Railway-ready.

> ⚡ One command to run locally · one push to deploy on Railway.

---

## Stack

**Backend**
- FastAPI · SQLAlchemy 2 · PostgreSQL (SQLite fallback for local dev)
- JWT auth with bcrypt, role-based access control (admin/member)
- Pydantic v2 schemas · Uvicorn

**Frontend**
- React 18 · TypeScript · Vite
- Tailwind CSS · Zustand · React Router 6 · Axios
- React Hook Form + Zod · Framer Motion · Recharts
- Phosphor Icons · React Hot Toast

**Infra**
- Docker + docker-compose (Postgres + Backend + Frontend/Nginx)
- Railway deployment config

---

## Quick start (local, no Docker)

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend (new terminal)
cd frontend
yarn install
yarn dev
```

Visit http://localhost:3000

### Default seeded accounts

| Role   | Email                | Password    |
|--------|----------------------|-------------|
| Admin  | admin@ethara.ai      | Admin@123   |
| Member | member@ethara.ai     | Member@123  |

---

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Frontend → http://localhost:3000  
Backend  → http://localhost:8001/api  
Docs     → http://localhost:8001/docs

---

## Deploying to Railway

1. **Push to GitHub** as a single repo.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin in the same project.
4. Create a **Backend** service from the same repo with:
   - Root directory: `backend`
   - Build: Dockerfile (auto-detected)
   - Variables:
     - `DATABASE_URL` → reference the Postgres plugin (Railway provides this automatically).
     - `JWT_SECRET` → any random 64-char hex.
     - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (optional overrides)
     - `CORS_ORIGINS` → your frontend domain (e.g. `https://app.example.com`)
   - Public networking: enable, expose port `$PORT` (auto).
5. Create a **Frontend** service from the same repo:
   - Root directory: `frontend`
   - Build: Dockerfile
   - Build arg / variable: `REACT_APP_BACKEND_URL` → your backend Railway URL (e.g. `https://ethara-backend.up.railway.app`).
6. Hit deploy. The backend auto-creates tables and seeds demo data on first start.

> Notes:
> - Backend auto-converts `postgres://` → `postgresql://` for SQLAlchemy.
> - Health check: `GET /api/health`.
> - Frontend reads `REACT_APP_BACKEND_URL` (kept for parity with CRA/legacy) at build time.

---

## Folder structure

```
ethara-team-task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── auth.py            # JWT + bcrypt
│   │   ├── deps.py            # Dependencies (auth, db)
│   │   ├── seed.py            # Demo data seeder
│   │   └── routers/           # auth, users, teams, projects, tasks, attendance, analytics
│   ├── server.py              # Entry-point wrapper
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/        # Sidebar, Topbar, Modal, Primitives, PunchClock
│   │   ├── pages/
│   │   │   ├── auth/          # Login, Register, ForgotPassword, AuthShell
│   │   │   ├── admin/         # Dashboard, Teams, Projects, Tasks, Attendance, Analytics
│   │   │   ├── member/        # Dashboard, MyTasks, MyProjects, MyAttendance
│   │   │   └── common/        # Profile, Settings, Notifications
│   │   ├── store/auth.ts      # Zustand auth store
│   │   ├── lib/api.ts         # Axios + token helpers
│   │   └── types.ts
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env
├── docker-compose.yml
├── railway.json
├── .env.example
├── .gitignore
└── README.md
```

---

## API surface

| Group        | Endpoints                                                                              |
|--------------|----------------------------------------------------------------------------------------|
| Auth         | `POST /api/auth/{register,login,logout,forgot-password,reset-password}` · `GET /api/auth/me` |
| Users        | `GET /api/users` · `GET /api/users/{id}` · `PATCH /api/users/me` · `PATCH/DELETE /api/users/{id}` (admin) |
| Teams        | `GET/POST /api/teams` · `GET/PATCH/DELETE /api/teams/{id}`                             |
| Projects     | `GET/POST /api/projects` · `GET/PATCH/DELETE /api/projects/{id}`                       |
| Tasks        | `GET/POST /api/tasks?q&status&project_id&assignee_id` · `GET/PATCH/DELETE /api/tasks/{id}` |
| Attendance   | `POST /api/attendance/{punch-in,punch-out}` · `GET /api/attendance` · `GET /api/attendance/{active,summary}` |
| Analytics    | `GET /api/analytics/{admin,member,activity}`                                           |

---

## Roadmap

- Real email integration for password reset (Resend / SendGrid)
- WebSocket activity stream
- Approvals & reviews workflow
- Time-off & leave management
- Mobile app (React Native)

---

## License

MIT — do anything, just don't blame us if it explodes.
