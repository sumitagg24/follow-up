# Founder Follow-Up — Venture Studio OS

An internal operations platform for venture studios: track portfolio ventures, automate founder follow-ups, generate reminder emails, and keep a complete activity trail — so no founder conversation slips through the cracks.

![Dashboard](docs/screenshots/dashboard.png)

> **Docs:** [Project Overview](PROJECT_OVERVIEW.md) • [Architecture](ARCHITECTURE.md) • [API Documentation](API_DOCUMENTATION.md) • [Testing](TESTING.md)

## Why this exists

Venture studios juggle dozens of founder relationships. Each venture needs an initial review, a founder follow-up, and an internal discussion — and every one of those needs a human to remember it. This system makes the follow-up itself automatic: ventures are created with tasks pre-generated, due dates are tracked, overdue items are flagged, and reminder emails go out on schedule (or on demand) with duplicate protection.

## Features

- **Venture pipeline** — full CRUD with search, status filter and sorting; desktop table and mobile card views
- **Auto-generated tasks** — every new venture gets Initial Review, Founder Follow-up and Internal Discussion tasks
- **Follow-up automation** — daily cron plus on-demand check; marks overdue items, generates reminders, sends emails (SMTP or dev log), with one-reminder-per-venture-per-day duplicate prevention
- **Rescheduling** — reschedule a follow-up and the venture's date stays in sync
- **Activity trail** — every meaningful action (creation, completion, reschedule, reminder) is logged and browsable
- **Dashboard** — 6 live KPIs, today's/overdue/upcoming follow-ups with inline actions, automation summary, recent activity
- **Automation Center** — run history, last-run metrics, one-click manual trigger
- **Analytics** — ventures by status, follow-up outcomes, task completion, 14-day activity volume (all real aggregates)
- **Tasks** — cross-venture task list with completion
- **Settings** — honest system status (DB mode, email mode, cron state)
- **Polished UX** — loading skeletons, empty states, confirmation dialogs, toast notifications, per-page titles, favicon, 404 page, keyboard/ARIA accessibility, responsive down to 320px

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3, React Router 6, Lucide icons |
| Backend | Node 22, Express 4, TypeScript, Mongoose 8 |
| Database | MongoDB (Atlas / local) with automatic in-memory fallback for zero-setup demos |
| Automation | node-cron (daily 09:00) + manual trigger endpoint |
| Email | Nodemailer with dev-mode console log when SMTP is unconfigured |
| Testing | Vitest + Supertest (unit + full E2E API workflow) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                 │
│  React SPA (Vite)                                                   │
│  pages/ ── components/ ── api/client.ts ── fetch("/api/...")        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST (JSON, proxied in dev)
┌──────────────────────────────▼──────────────────────────────────────┐
│                              SERVER                                 │
│                                                                     │
│  routes/  ──►  controllers/  ──►  services/  ──►  models/ (Mongoose)│
│                  │ validation          │                            │
│                  │ utils/http.ts       ├─► automationService        │
│                  │ (asyncHandler,      │    checkDueFollowUps()     │
│                  │  HttpError)         └─► emailService            │
│                                          sendReminderEmail()        │
│  jobs/cron.ts ──► checkDueFollowUps()  (same service as manual)     │
│                                                                     │
│  Central error handler: every failure → predictable JSON status     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │       MongoDB        │
                    │  Atlas / local, or   │
                    │  in-memory fallback  │
                    └──────────────────────┘
```

**Automation flow** (cron 09:00 daily, or `POST /api/automation/check-followups`):

```
node-cron / manual trigger
   ↓
checkDueFollowUps()
   ↓
find pending + overdue follow-ups
   ↓
mark newly-overdue → activity
   ↓
duplicate check (one reminder per venture per due-day)
   ↓
generate reminder → activity
   ↓
send email (SMTP) or dev-log → activity
```

## Quick Start

```bash
# 1. Backend
cd server && npm install
npm run dev          # http://localhost:4000  (health: /api/health)

# 2. Frontend (new terminal)
cd client && npm install
npm run dev          # http://localhost:5173
```

With no environment variables set, the server spins up an **in-memory MongoDB** — perfect for demos, but data resets on restart.

## Environment Variables

Copy `server/.env.example` to `server/.env`:

```bash
MONGODB_URI=            # optional; Atlas or local MongoDB for persistence
PORT=4000
CLIENT_URL=http://localhost:5173
SMTP_HOST=              # optional; leave empty for dev-mode email logging
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Connecting MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) and get your connection string.
2. Set `MONGODB_URI` in `server/.env`, restart the server — logs should say `[DB] Connected to MongoDB`.
3. **Persistence test:** start the server → create a venture → stop the server → start it again → verify the venture still exists. That confirms you're off the in-memory fallback.

## API Reference

Base URL: `http://localhost:4000`

All endpoints return JSON. Errors are predictable: `{ "error": string }` and, for validation failures, `{ "error": "Validation failed", "details": string[] }`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/ventures` | List ventures — `?search=&status=&sort=newest\|oldest` |
| POST | `/api/ventures` | Create venture (+ 3 auto tasks + follow-up) |
| GET | `/api/ventures/:id` | Venture detail + follow-up + tasks + activity |
| PUT | `/api/ventures/:id` | Update venture (syncs open follow-up date) |
| DELETE | `/api/ventures/:id` | Delete venture + cascade follow-ups/tasks/activity |
| GET | `/api/ventures/:id/activity` | Activity for one venture |
| GET | `/api/followups` | List follow-ups — `?status=pending\|completed\|overdue` |
| POST | `/api/followups` | Create follow-up `{ ventureId, dueDate }` |
| PUT | `/api/followups/:id/complete` | Mark completed (idempotent) |
| PUT | `/api/followups/:id/reschedule` | Reschedule `{ dueDate }` |
| GET | `/api/tasks` | List tasks — `?ventureId=` |
| POST | `/api/tasks` | Create task `{ ventureId, title, dueDate? }` |
| PUT | `/api/tasks/:id/complete` | Mark completed (idempotent) |
| GET | `/api/activity` | Global activity feed (`?limit=`, max 200) |
| GET | `/api/dashboard` | Stats + today's follow-ups + recent activity |
| GET | `/api/dashboard/stats` | Stats only |
| POST | `/api/automation/check-followups` | Run follow-up check now |
| POST | `/api/seed` | Load demo data (6 ventures) |
| GET | `/api/anything-else` | JSON 404 — no HTML error pages |

## Demo Workflow

This is the end-to-end flow the E2E test suite verifies:

1. **Create Venture** → 3 tasks auto-created, follow-up created, activity logged
2. **Dashboard** reflects new stats and today's follow-ups
3. **Open venture** → complete a task → activity generated (idempotent)
4. **Reschedule follow-up** → venture date synced, activity generated
5. **Make it overdue** → **Run Reminder Check** → overdue flagged, reminder generated, email dev-logged
6. **Run again** → no duplicate reminder
7. **Delete venture** → follow-ups, tasks, and activities cascade-deleted

Run it yourself: `cd server && npm test`

## Screenshots

| | |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Ventures](docs/screenshots/ventures.png) |
| ![Automation](docs/screenshots/automation.png) | ![Analytics](docs/screenshots/analytics.png) |
| ![Tasks](docs/screenshots/tasks.png) | ![Activity](docs/screenshots/activity.png) |
| ![Venture details](docs/screenshots/venture-details.png) | ![Settings](docs/screenshots/settings.png) |
| ![Mobile dashboard](docs/screenshots/mobile-dashboard.png) | ![404 page](docs/screenshots/404.png) |

## Testing

```bash
cd server && npm test     # unit + E2E API tests (Vitest + Supertest, in-memory Mongo)
```

Covers: validation and error shapes, venture creation with auto-tasks, task/follow-up completion idempotency, rescheduling, overdue detection, duplicate reminder prevention, dashboard stats, cascade delete, and the full Step-by-step demo workflow above.

## Project Structure

```
client/
  src/
    api/client.ts        # typed fetch wrapper
    components/          # Modal, ConfirmDialog, Toast, Skeleton, EmptyState…
    hooks/usePageTitle   # per-page document titles
    pages/               # Dashboard, Ventures, VentureForm, VentureDetails, ActivityLog, NotFound
server/
  src/
    app.ts               # Express app (routes, seed, error handler) — testable
    server.ts            # DB connect + listen + graceful shutdown
    routes/              # ventures, followups, tasks, activity, dashboard, automation
    controllers/         # request handling + validation
    services/            # automationService, emailService
    models/              # Venture, FollowUp, Task, Activity (Mongoose)
    jobs/cron.ts         # daily 09:00 reminder check
    tests/               # unit + E2E API tests
    utils/               # http helpers (HttpError, asyncHandler), validators
```

## Limitations

- No auth / RBAC — internal MVP assumption
- Dev seed endpoint is unauthenticated — disable before any shared deployment
- In-memory fallback does not persist across restarts — set `MONGODB_URI` for real use
- Email without SMTP is console-logged and recorded as `reminder_email_dev` activity — actual delivery requires SMTP configuration and verification
- Activity feed is capped at 200 per request — no pagination UI
- Dependency advisories: server is clean (`qs` pinned to patched 6.16.x via npm `overrides`, same major). Client retains a moderate advisory in `react-router` (SSR `deserializeErrors` injection, GHSA-337j-9hxr-rhxg) — **not applicable to this app** (SPA only, no SSR); the fix requires the breaking `react-router-dom@7` upgrade, deliberately deferred for stability
