# API Documentation

Base URL: `http://localhost:4000`

All endpoints return JSON. CORS is restricted to `CLIENT_URL` (default `http://localhost:5173`).

## Conventions

- **Success:** `200` (or `201` for creation) with a JSON body.
- **Validation failure:** `400 { "error": "Validation failed", "details": ["..."] }`
- **Bad identifier:** `400 { "error": "Invalid venture id" }` (ids must be 24-char hex ObjectIds)
- **Missing record:** `404 { "error": "Venture not found" }`
- **Unknown API route:** `404 { "error": "Not found: GET /api/whatever" }` — never HTML
- **Malformed JSON body:** `400 { "error": "Invalid JSON body" }`
- **Unexpected failure:** `500 { "error": "..." }` (details logged server-side only)

---

## System

### `GET /api/health`
Liveness probe. → `{ ok: true, time: "2026-09-10T17:58:01.392Z" }`

### `GET /api/system`
Honest runtime status. →
```json
{
  "db": { "mode": "mongodb | in-memory | disconnected", "persistent": true, "connected": true, "name": "founder-followup" },
  "email": { "smtpConfigured": false, "mode": "smtp | development-log" },
  "automation": { "cronScheduled": true, "schedule": "0 9 * * * (daily 09:00)" },
  "uptimeSeconds": 120,
  "version": "1.0.0"
}
```
`mode: "in-memory"` means data will NOT survive a restart.

---

## Ventures

### `GET /api/ventures`
Query: `search` (name, case-insensitive), `status` (New|Evaluation|Review|Active|Closed), `sort` (`newest`|`oldest`).
→ Array of ventures, each enriched with:
- `followUp` — the venture's follow-up record (or `null`)
- `taskCounts` — `{ total, completed }`
- `lastActivity` — `{ lastAt, lastDescription }` (or `null`)

### `POST /api/ventures`
Body: `{ name, founderName, founderEmail, industry, status, followUpDate, notes? }`
- All fields except `notes` required; email must be valid; `followUpDate` must parse as a date.
→ `201 { venture, followUp, tasks: [3 tasks] }` — also creates the follow-up, three auto tasks, and `venture_created` + `task_created` activities.

### `GET /api/ventures/:id`
→ `{ venture, followUp, tasks, activities (latest 20) }`

### `PUT /api/ventures/:id`
Same body as POST. If an open (pending/overdue) follow-up exists, its due date is synced; an overdue follow-up becomes pending again if the new date is today or later. → `200 venture`. Logs `venture_updated`.

### `DELETE /api/ventures/:id`
Cascades: deletes follow-ups, tasks, and activities for the venture. → `{ ok: true }`

### `GET /api/ventures/:id/activity`
→ Array of all activities for the venture, newest first.

---

## Follow-ups

### `GET /api/followups`
Query: `status` (pending|completed|overdue). → Array (venture populated), sorted by due date.

### `POST /api/followups`
Body: `{ ventureId, dueDate }`. Venture must exist. → `201 followUp`

### `PUT /api/followups/:id/complete`
Idempotent: completing twice does not duplicate activity. → `200 followUp` + `followup_completed` activity.

### `PUT /api/followups/:id/reschedule`
Body: `{ dueDate }`. Resets status to `pending`, clears `completedAt`, and syncs the venture's `followUpDate`. → `200` + `followup_rescheduled` activity.

---

## Tasks

### `GET /api/tasks`
Query: `ventureId`. → Array sorted by due date; `ventureId` is populated with `{ _id, name, status, founderName }`.

### `POST /api/tasks`
Body: `{ ventureId, title, dueDate?, status? }`. Venture must exist. → `201 task` + `task_created` activity.

### `PUT /api/tasks/:id/complete`
Idempotent. → `200 task` + `task_completed` activity (first time only).

---

## Dashboard

### `GET /api/dashboard/stats`
→ `{ totalVentures, activeVentures, pendingFollowUps, todaysFollowUps, overdueFollowUps, completedFollowUps, openTasks, completedTasks }`
- `activeVentures`: status ∈ {Evaluation, Review, Active}
- `todaysFollowUps`: pending/overdue due today
- `openTasks` / `completedTasks`: Task collection counts

### `GET /api/dashboard`
Everything the dashboard needs in one request:
```json
{
  "stats": { "...as above" },
  "todaysFollowUps":   [ /* pending|overdue due today, venture populated, max 10 */ ],
  "overdueFollowUps":  [ /* all overdue, venture populated, max 10 */ ],
  "upcomingFollowUps": [ /* pending, due within next 7 days, max 10 */ ],
  "recentActivity":    [ /* latest 10 events */ ],
  "lastAutomationRun": { "at": "...", "triggeredBy": "cron|manual", "checked": 5, "overdueFound": 0, "remindersGenerated": 3, "emailsSent": 0, "durationMs": 31 } | null
}
```

---

## Automation

### `POST /api/automation/check-followups`
Runs the follow-up check immediately (same code path as the cron job). →
```json
{ "triggeredBy": "manual", "checked": 5, "overdueFound": 0, "remindersGenerated": 3, "emailsSent": 0, "durationMs": 31 }
```
`emailsSent` counts only real SMTP deliveries; dev-logged emails are recorded as `reminder_email_dev` activities instead. A summary is stored as an `automation_run` activity (with `meta`), powering the Automation Center history.

---

## Activity

### `GET /api/activity`
Query: `limit` (1–200, default 100), `action` (filter by type), `ventureId`.
Valid `action` values: `venture_created`, `venture_updated`, `venture_deleted`, `task_created`, `task_completed`, `followup_completed`, `followup_rescheduled`, `followup_overdue`, `reminder_generated`, `reminder_email_sent`, `reminder_email_dev`, `reminder_email_failed`, `automation_run`.
Unknown action → `400` with the valid list. → Array, newest first.

---

## Analytics

### `GET /api/analytics`
Real-time aggregates (no caching, no sampling):
```json
{
  "venturesByStatus":  [{ "_id": "Active", "count": 2 }, ...],
  "followUpOutcomes":  [{ "_id": "pending", "count": 3 }, ...],
  "taskStats":         [{ "_id": "pending", "count": 15 }, ...],
  "activityVolume":    [{ "date": "2026-08-29", "count": 0 }, ...]  // always 14 entries
}
```

---

## Dev utilities

### `POST /api/seed`
Wipes all collections and inserts 6 demo ventures (mixed due dates/statuses) with tasks and activities. **Unauthenticated — do not expose publicly.**

---

## Email delivery contract

| SMTP state | Behavior | Activity recorded | Counted in `emailsSent` |
|---|---|---|---|
| `SMTP_HOST`+`SMTP_USER`+`SMTP_PASS` set | Nodemailer delivers to founder email | `reminder_email_sent` | Yes |
| Not set (default) | Email content logged to server console | `reminder_email_dev` | No |
| Delivery attempted but failed | Error logged | `reminder_email_failed` | No |

The system never claims a real delivery that did not happen.
