# Project Overview

**Founder Follow-Up** is an internal operations platform for venture studios. It tracks portfolio ventures, auto-generates their standard workflow tasks, manages founder follow-up schedules, and automates reminder emails with duplicate protection — while logging every meaningful action in a browsable activity trail.

## The problem it solves

In a venture studio, every venture needs the same rhythm: an initial review, a founder follow-up, an internal discussion. Tracking those across dozens of ventures in spreadsheets means missed follow-ups and stale relationships. This system makes the follow-up schedule a first-class, automated object:

```
Venture created
   ↓  (automatic)
3 workflow tasks + a follow-up schedule
   ↓  (automatic, daily or on demand)
Overdue detection → reminder generation → email/dev-log → activity trail
```

## Feature map

| Area | Where | What it does |
|---|---|---|
| **Operational dashboard** | `/` | 6 live KPIs (ventures, active, due today, overdue, open/done tasks), today's / overdue / upcoming follow-up lists with actions, automation summary strip, recent activity |
| **Venture pipeline** | `/ventures` | Search, status filter, sorting, status badges, follow-up status, task progress, last activity; desktop table / mobile cards |
| **Venture lifecycle** | `/ventures/new`, `/ventures/:id`, `/ventures/:id/edit` | Validated create/edit form (inline field errors), detail page with overview, follow-up, tasks, activity |
| **Task management** | `/tasks` | All tasks across ventures with all/pending/completed tabs and one-click completion |
| **Automation center** | `/automation` | Last-run summary (checked / overdue / reminders / emails), Run Now action, full run history |
| **Activity trail** | `/activity` | Filterable chronological feed with typed badges (13 action types) |
| **Analytics** | `/analytics` | Real aggregates: ventures by status, follow-up outcomes, task completion, 14-day activity volume |
| **Settings** | `/settings` | Honest system status: DB mode, email mode, cron state, env-var reference |

## Key user flows

### Create a venture
Ventures → Add Venture → fill form (validated inline and server-side) → venture created with 3 tasks, a follow-up, and activity records → redirected to detail page.

### Handle a due follow-up
Dashboard → Today's Follow-ups → **Complete** (finishes it) or **Reschedule** (accessible modal, syncs the venture's date) or **View** (detail page).

### Run the reminder automation
Automation Center → **Run Automation Now** → real result banner (checked/overdue/reminders/emails) → run recorded in history. The daily cron (09:00) runs the identical code path. Duplicate reminders for the same venture + due date are impossible by design.

### Trust the status reporting
Settings shows exactly what mode the system is in. In-memory database and development email logs are labeled as such — the UI never pretends data persists or that emails were delivered when they were only logged.

## Design principles followed

- Real data only — every number comes from a database query or API response
- No `window.prompt()` / `window.confirm()` — custom accessible dialogs
- Loading skeletons, empty states, and error banners on every page
- Keyboard accessible (Escape closes dialogs, visible focus, ARIA roles/labels)
- Responsive 320px → 1440px with ≥44px touch targets
- Honest labeling of dev fallbacks (in-memory DB, logged emails)

## Future improvements

- Role-based access and multi-tenancy (currently single-tenant with JWT login — MVP assumption)
- Pagination for large venture/activity lists (currently capped: 200 activity / 10 dashboard lists)
- Configurable cron schedule and per-venture reminder timing
- Email digest (daily summary) in addition to per-follow-up reminders
- Venture notes timeline / founder communication history
