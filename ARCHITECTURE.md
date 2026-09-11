# Architecture

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                 │
│  React 18 SPA (Vite + TypeScript + Tailwind)                        │
│                                                                     │
│  pages/ ──► components/ ──► api/client.ts ──► fetch("/api/...")     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST / JSON (Vite proxy in dev)
┌──────────────────────────────▼──────────────────────────────────────┐
│                              SERVER                                 │
│                                                                     │
│  routes/ ──► controllers/ ──► services/ ──► models/ (Mongoose)      │
│                 │                     │                             │
│                 │ validation          ├─ automationService          │
│                 │ utils/http.ts       │   checkDueFollowUps()       │
│                 │ (asyncHandler,      └─ emailService              │
│                 │  HttpError)             sendReminderEmail()       │
│                                                                     │
│  jobs/cron.ts ──► checkDueFollowUps("cron")   (same service path)   │
│                                                                     │
│  Central error handler → every failure is predictable JSON          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                     ┌─────────▼──────────┐
                     │      MongoDB       │
                     │ Atlas / local, or  │
                     │ in-memory fallback │
                     └────────────────────┘
```

## Backend layering

| Layer | Responsibility | Notes |
|---|---|---|
| `routes/` | URL → handler mapping | Thin routers only (`auth` holds register/login/me/password) |
| `middleware/` | `requireAuth` (Bearer JWT → `req.user`), security headers | Malformed/expired tokens → 401, never crash |
| `controllers/` | Request validation, orchestration, response shape | Throw `HttpError` for expected failures |
| `services/` | Business logic (automation, email, activity creation) | Shared by cron and manual trigger |
| `models/` | Mongoose schemas | User, Venture, FollowUp, Task, Activity (+ targeted indexes) |
| `utils/` | `http.ts` (asyncHandler/HttpError), `validate.ts`, `runtime.ts`, `env.ts` (production fail-fast guards) | Cross-cutting concerns |

**Why `app.ts` and `server.ts` are separate:** `createApp()` builds the Express app (security headers, CORS, routes, seed guard, error handler) with no side effects, so Supertest can exercise the full HTTP stack in tests. `server.ts` owns env-validated DB connection, listening, cron start, and graceful shutdown. In production, missing `MONGODB_URI`/`JWT_SECRET`/`CLIENT_URL` fail startup instead of degrading silently.

## Automation pipeline

```
node-cron "0 9 * * *"          POST /api/automation/check-followups
        │                              │
        └──────────┬───────────────────┘
                   ▼
        checkDueFollowUps(triggeredBy)
                   ▼
   find follow-ups with status pending|overdue
                   ▼
   due date < today?  → mark overdue + activity "followup_overdue"
                   ▼
   duplicate check: existing "reminder_generated" activity
   for this venture whose description contains "due YYYY-MM-DD"
   of the follow-up's due day?  → skip
                   ▼
   create "reminder_generated" activity
                   ▼
    sendReminderEmail()
      ├─ SMTP configured + delivered  → "reminder_email_sent" activity (only these count in emailsSent)
      ├─ SMTP configured + threw      → "reminder_email_failed" activity
      └─ no SMTP                      → console log + "reminder_email_dev" activity (never counted as delivered)
                    ▼
    record run summary as "automation_run" activity (meta: checked,
    overdueFound, remindersGenerated, emailsSent, durationMs, trigger)
```

The duplicate-prevention rule is **one reminder per venture per follow-up due-day**. Re-running the check the same day never generates a second reminder for the same due date.

Two honesty properties: a service-level exception propagates (HTTP 500) instead of returning a zero-valued "successful" summary, and `emailsSent` increments only after `sendMail` resolves. Known MVP limitation: the check-then-insert dedupe is not atomic, so two truly overlapping runs could duplicate a reminder — accepted for a single-instance backend where the daily cron and manual runs do not overlap (see code comment in `automationService.ts`).

## Error model

- Expected failures: controllers throw `HttpError(status, message, details?)` → `{ error, details? }`
- Mongoose `ValidationError` / `CastError` / malformed JSON → `400`
- Unknown `/api/*` route → JSON `404` (never HTML)
- Unknown action filter values → `400` with valid options listed
- Anything else → `500` after server-side logging: the real message in development, generic `Internal server error` in production (no stack traces, DB internals, paths, or secrets leak to clients)

## Data model

```
User      standalone (name, unique email, bcrypt passwordHash; no relations — single-tenant MVP)
Venture ──1:N──► Task       (auto-created: Initial Review, Founder Follow-up, Internal Discussion)
        ──1:1──► FollowUp   (dueDate, status: pending|completed|overdue)
        ──1:N──► Activity   (action, description, optional meta; automation_run has ventureId: null)
```

Delete cascade: deleting a venture removes its follow-ups, tasks, and activities in parallel.

## Frontend structure

- `App.tsx` — auth gate (`checking` → restore via `/api/auth/me`), single router, protected-route redirects, shared top bar + footer
- `pages/` — one component per route; each handles loading (skeletons), error (banner + retry), and empty states
- `components/` — design-system primitives: `Modal` (Escape, focus, ARIA), `ConfirmDialog`, `Toast` (aria-live), `Skeleton`, `EmptyState`, `ActivityBadge`
- `api/client.ts` — single fetch wrapper; token from localStorage (remember-me) or sessionStorage; 401 clears both stores and routes to login; errors become thrown `Error`s with the server's message
- `hooks/usePageTitle.ts` — per-page document titles
