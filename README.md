# Founder Follow-Up and Task Automation System

Small internal operations prototype for a venture studio. Manages ventures, follow-ups, auto-creates tasks, runs scheduled reminders, and logs activity.

## Features
- Venture CRUD with validation
- Automatic task creation (Initial Review, Founder Follow-up, Internal Discussion) + activity logging on venture creation
- Follow-up complete / reschedule (centered modals, no prompt/confirm)
- Scheduled follow-up checker (node-cron daily 9am) + manual `POST /api/automation/check-followups`
- Duplicate reminder prevention (one reminder per venture per due-date per day)
- Email via Nodemailer (dev-mode console log if SMTP not configured)
- Dashboard stats, today's follow-ups, recent activity
- Ventures table with search, status filter, sorting
- Venture details with tasks + activity
- Activity log
- Responsive (320px → 1440px), Tailwind, Lucide icons

## Tech Stack
- Frontend: React 18, TypeScript, Vite, Tailwind 3, React Router 6, Lucide React
- Backend: Node 22, Express 4, TypeScript, Mongoose 8, mongodb-memory-server (fallback), node-cron, Nodemailer, dotenv, cors
- DB: MongoDB (real or in-memory)

## Architecture
```
client/  Vite + React → REST → server/
server/  routes → controllers → services → models (Mongoose)
         services/automationService.checkDueFollowUps() used by both cron and manual trigger
         services/emailService.sendReminderEmail()
         jobs/cron.ts  daily 09:00
```

## Setup
```bash
# from repo root
cd server && npm install
cd ../client && npm install
```

## Environment Variables
Create `server/.env` (see `server/.env.example`):
```
MONGODB_URI=mongodb://localhost:27017/founder-followup
PORT=4000
CLIENT_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```
- If `MONGODB_URI` is unset or unreachable, server falls back to in-memory MongoDB (data not persisted) and logs clearly.
- If SMTP vars missing, reminders are console-logged + stored as activity `reminder_email_dev`.

## Database Setup
- Local MongoDB: `mongod --dbpath ./data` then set `MONGODB_URI`
- Or leave unset to use in-memory (zero setup, for demo)
- Production: use Atlas URI

## Seed Data
```bash
# Option A: via running server (recommended for in-memory)
curl -X POST http://localhost:4000/api/seed
# or click "Seed" if you add it, or just create ventures manually

# Option B: direct DB seed (requires MONGODB_URI to be real)
cd server && npm run seed
```
Seeds 6 ventures across industries with mixed due dates (today, overdue, future, completed), 3 tasks each, activity.

## Running the Project
```bash
# terminal 1 — backend
cd server
npm run dev    # http://localhost:4000  (health: /api/health)

# terminal 2 — frontend
cd client
npm run dev    # http://localhost:5173
```
Build:
```bash
cd server && npm run build && npm start
cd client && npm run build && npm run preview
```

## Automation
- Cron: `0 9 * * *` → `checkDueFollowUps()` → marks overdue, generates `reminder_generated`, attempts email, logs `reminder_email_sent` / `reminder_email_dev`
- Manual: `POST /api/automation/check-followups` → same service, returns `{ checked, overdueFound, remindersGenerated, emailsSent }`. Dashboard has "Run Reminder Check" button.

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ventures | create + auto tasks |
| GET | /api/ventures | list (search, status, sort) |
| GET | /api/ventures/:id | detail + followUp + tasks + activities |
| PUT | /api/ventures/:id | update |
| DELETE | /api/ventures/:id | delete + cascade |
| GET | /api/ventures/:id/activity | venture activity |
| GET | /api/followups | list |
| POST | /api/followups | create |
| PUT | /api/followups/:id/complete | complete |
| PUT | /api/followups/:id/reschedule | reschedule (body: {dueDate}) |
| GET | /api/tasks | list (?ventureId) |
| PUT | /api/tasks/:id/complete | complete |
| GET | /api/activity | feed (newest first) |
| GET | /api/dashboard/stats | stats |
| GET | /api/dashboard | stats + today + recent |
| POST | /api/automation/check-followups | manual trigger |
| POST | /api/seed | dev seed |
| GET | /api/health | health |

## Demo Workflow
1. Dashboard: check stats + today's follow-ups + recent activity. If empty, `curl -X POST http://localhost:4000/api/seed`.
2. Add Venture: Ventures → Add Venture → Nova AI / Rahul Sharma / rahul@example.com / AI & Machine Learning / Evaluation / tomorrow → Save → see redirect to details, 3 tasks auto-created, activity.
3. Venture Details: verify info, follow-up, tasks, activity.
4. Run Reminder Check: Dashboard → Run Reminder Check → toast shows result, activity logs reminder.
5. Reschedule: in Dashboard or Details → Reschedule → pick new date → activity updates.
6. Complete: Complete → status → completed, dashboard stats update.

## Tests
```bash
cd server && npm test
```
Covers: venture creation + auto tasks, complete, reschedule, overdue detection, duplicate prevention, dashboard stats, delete cascade.

## Limitations
- No auth / RBAC (MVP)
- In-memory DB does not persist across restarts (use MONGODB_URI for persistence)
- Email requires SMTP env; otherwise dev-logged
- No pagination (100 activity limit)
