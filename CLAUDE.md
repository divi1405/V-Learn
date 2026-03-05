# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VeLearn** — a corporate LMS (Learning Management System) with four components:
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL, port 8000
- **Web**: Next.js 14 (App Router, JavaScript, no TypeScript), port 3000 — lives in `web/`
- **Mobile**: React Native CLI (TypeScript) — lives in `mobile/`, built via the 5-agent workflow below
- **Infra**: Docker Compose orchestrates `db`, `backend`, and `web` services

## Commands

### Makefile (recommended)
```bash
make dev         # docker-compose up --build (backend + web + db)
make backend     # uvicorn only (requires local PostgreSQL)
make web         # Next.js dev server only
make mobile      # npx react-native start (Metro bundler)
make setup-db    # create local PostgreSQL user + database (run once)
make install     # npm install in web/ and mobile/
```

### Direct commands
```bash
# Full stack
docker-compose up --build

# Web only
cd web && npm run dev

# Backend only
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Mobile (after local RN setup)
cd mobile && npx react-native run-android
cd mobile && npx react-native run-ios
cd mobile && npm run type-check   # tsc --noEmit
cd mobile && npm run lint          # eslint src

# Seed the database (also runs automatically on backend startup)
cd backend && python -c "from app.seed import seed; seed()"

# Import employee data from Excel
cd backend && python import_combined_data.py
```

## Architecture

### Backend (`backend/app/`)

| File/Dir | Purpose |
|---|---|
| `main.py` | App entry point — registers all routers, CORS, mounts `/api/uploads`, runs DB migrations on startup |
| `models.py` | All SQLAlchemy ORM models (single file) |
| `schemas.py` | All Pydantic request/response schemas (single file) |
| `auth.py` | JWT (`python-jose`), bcrypt, `get_current_user` dependency, `require_role(*roles)` factory |
| `config.py` | Reads `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` from env |
| `database.py` | SQLAlchemy engine + `get_db` session dependency |
| `routers/` | One file per domain: `auth`, `users`, `courses`, `modules`, `lessons`, `quizzes`, `enrollments`, `learning_paths`, `certificates`, `analytics`, `leaderboard`, `badges`, `reviews`, `lna`, `upload`, `ai`, `manager`, `recommendations` |

All router prefixes follow `/api/<resource>`. Interactive docs at `http://localhost:8000/docs`. FastAPI error field is `detail`.

**Auth pattern:**
```python
from app.auth import get_current_user, require_role

@router.get("/something")
def endpoint(user: User = Depends(get_current_user)): ...

@router.delete("/admin-only")
def admin_endpoint(user: User = Depends(require_role("ADMIN", "HR_ADMIN"))): ...
```

**User roles**: `ADMIN`, `HR_ADMIN`, `CONTENT_AUTHOR`, `LEARNER`, `MANAGER`

**DB schema hierarchy**: `LearningPath` → `Course` → `Module` → `Lesson` → `Quiz` → `Question`. `Enrollment`, `LessonProgress`, `QuizAttempts`, `Certificates` track learner activity.

### Web Frontend (`web/src/`)

| Path | Purpose |
|---|---|
| `lib/api.js` | Singleton `ApiClient` — all fetch calls go through here. Reads/writes JWT and user from `localStorage`. Auto-redirects to `/login` on 401. Use `api.get(path)`, `api.post(path, data)`, etc. — path is relative to `/api`. |
| `app/layout.js` | Root layout |
| `components/Sidebar.js` | Role-aware navigation sidebar |
| `components/Header.js` | Top header bar |
| `components/Icons.js` | Inline SVG icon components |
| `app/admin/`, `app/manager/` | Role-scoped pages; learner pages at root level |

**Auth pattern in pages** (client components):
```js
'use client';
const u = api.getUser(); // reads from localStorage
if (!u) { router.push('/login'); return; }
```

`next.config.js` rewrites `/api/*` → `http://backend:8000/api/*` (Docker service name). For local dev without Docker, set `NEXT_PUBLIC_API_URL=http://localhost:8000`.

### Mobile App (`mobile/`)

React Native CLI (TypeScript). Currently under construction via the 5-agent team workflow — `mobile/` is empty until agents complete their work.

**Planned architecture:**
- `src/types/index.ts` — all TypeScript interfaces
- `src/constants/theme.ts` — design tokens (colours, spacing, typography)
- `src/lib/apiClient.ts` — axios instance, reads `API_URL` from `.env` via `react-native-config`
- `src/lib/storage.ts` — `react-native-keychain` for JWT, AsyncStorage for generic KV
- `src/lib/cacheManager.ts` — TTL-based cache over AsyncStorage
- `src/lib/downloadManager.ts` — offline video downloads via `react-native-fs`
- `src/lib/notifications.ts` — push via `@react-native-firebase/messaging`
- `src/context/AuthContext.tsx` + `UserContext.tsx` — auth state
- `src/navigation/` — `RootNavigator` (auth vs app), `AuthStack`, `AppNavigator` (bottom tabs)
- `src/screens/` — grouped by domain: `auth/`, `courses/`, `dashboard/`, `notifications/`, `profile/`
- `src/hooks/useCachedFetch.ts` — wraps apiClient + cacheManager

**Mobile env var**: `mobile/.env` → `API_URL=http://10.0.2.2:8000` (Android emulator alias for localhost; use LAN IP for physical devices).

**Firebase native setup** (required at local setup time, not during Docker agent work):
- Android: `google-services.json` → `android/app/`
- iOS: `GoogleService-Info.plist` → `ios/VeLearn/`

### 5-Agent Mobile Build Workflow

The mobile app is being built in parallel by a team of 5, each running a Claude Code agent in Docker against the shared repo. See `agents/` for full agent definitions.

| Agent file | Owns | Blocks others? |
|---|---|---|
| `agent1-auth-shell.md` | Project scaffold, shared contracts (types, theme, apiClient, cacheManager, storage), navigation, auth screens | **Yes — everyone waits for `.claude/status/agent1-contracts-done`** |
| `agent2-course-player.md` | Course list/detail, video player, article lessons, quiz engine, certificates | Waits for agent1 |
| `agent3-dashboard.md` | Home dashboard, leaderboard, learning paths, LNA, streak calendar, manager view | Waits for agent1 + agent1-cache-done |
| `agent4-notif-download.md` | Download manager, push notifications (Firebase), notification centre, OfflineBanner | Waits for agent1 |
| `agent5-testing-qa.md` | MSW handlers, Jest unit tests, RNTL component tests, Detox E2E (12 scenarios) | Starts immediately (MSW phase has no dependencies) |

Agent status markers are written to `mobile/.claude/status/` so agents can poll for dependencies.

### Environment Variables

| Variable | Default | Service |
|---|---|---|
| `DATABASE_URL` | `postgresql://lms_user:lms_password@localhost:5432/lms_db` | Backend |
| `JWT_SECRET` | `super-secret-jwt-key-change-in-production` | Backend |
| `CORS_ORIGINS` | `http://localhost:3000` | Backend (comma-separated) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Web (Docker build) |
| `API_URL` | `http://10.0.2.2:8000` | Mobile (`mobile/.env`) |

### File Uploads & Certificates

- Uploaded files → `backend/uploads/`, served at `/api/uploads/<filename>`
- Generated certificate PDFs → `backend/certificates/`
- Both volume-mounted in Docker Compose

## AWS Deployment (`infra/aws-deploy.md`)

| Component | Service |
|---|---|
| Web (`web/`) | AWS Amplify — auto-deploys on git push; app root = `web`, build = `npm run build` |
| Backend (`backend/`) | AWS Elastic Beanstalk — Docker container, port 8000 |
| Database | Amazon RDS PostgreSQL (private, only EB security group can reach it) |
| Mobile | React Native CLI build — native tooling (Xcode / Android Studio) or CI pipeline |

See `infra/aws-deploy.md` for full CLI commands, `amplify.yml`, and security checklist. Note: the mobile section of that doc references the old Expo/EAS workflow — it is outdated now that mobile uses React Native CLI.

## Known Issues / Patterns

- `is_first_login` flag: when `true`, redirect user to change-password screen after login
- `profile_image` column added via idempotent `ALTER TABLE` in `main.py` startup (try/except pattern)
- Enrollment serialization: `course_id` can be NULL — handle `Optional` in schemas if 500s appear on `GET /api/enrollments`
- `GET /api/badges` historically returns 404; use `/badges/me` with `.catch(() => [])` fallback on the dashboard
