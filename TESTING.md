# Testing

## Commands

```bash
# Backend — unit + E2E API tests (Vitest + Supertest, in-memory MongoDB)
cd server
npm test

# Backend — type check + production build
npx tsc --noEmit
npm run build

# Frontend — type check + production build
cd ../client
npm run build
```

## What the suite covers

`server/src/tests/api.e2e.test.ts` exercises the real Express app (`createApp()`) against an in-memory MongoDB via Supertest:

| Area | Verified behavior |
|---|---|
| Validation | 400 + `details[]` for missing/invalid venture fields; invalid dates rejected; invalid id format → 400; unknown activity action → 400 |
| Error shapes | 404 JSON for missing venture; JSON 404 for unknown API routes |
| Venture creation | `201`, follow-up created, **3 tasks auto-created**, `venture_created` + 3× `task_created` activities |
| Task completion | Marks completed; **idempotent** (no duplicate activity on second call) |
| Rescheduling | Due date updated, status resets to pending, venture `followUpDate` synced, activity logged |
| Overdue detection | Pending follow-up past due becomes `overdue` + `followup_overdue` activity |
| Reminder generation | Automation run produces `reminder_generated` + `reminder_email_dev` (no SMTP in tests) |
| **Duplicate prevention** | Second automation run same day → `remindersGenerated: 0` |
| Dashboard v2 | Extended KPIs (activeVentures, openTasks…), today/overdue/upcoming lists, `lastAutomationRun` |
| Automation history | Manual run recorded as `automation_run` activity with `meta`; `?action=automation_run` filter returns it |
| Analytics | Real aggregates by status; activity volume axis always spans 14 days |
| System status | Honest reporting: `db.mode`, `persistent: false`, `email.mode: "development-log"`, cron state |
| Tasks list | `ventureId` populated with venture info |
| Ventures list | `taskCounts` + `followUp` enrichment |
| Delete cascade | Venture deletion removes tasks, follow-up, and activities |

`server/src/tests/automation.test.ts` covers the service layer directly: overdue marking, same-day dedupe (including cron↔manual consistency), quiet runs with honest zero histories, `followup_overdue`/`reminder_generated` activities, email success / failure / dev-log paths (mocked SMTP transport), and exception propagation (DB failures reject instead of returning zero summaries).

`server/src/tests/auth.test.ts` covers registration, login (including no-enumeration), session restore, password change, and 401 handling for missing/invalid/deleted-account tokens.

`server/src/tests/security.test.ts` covers production guards: JWT fail-fast on missing/weak secrets, `requireEnv`, baseline security headers, seed auth-gating + production 403/`ALLOW_SEED` unlock, and generic production 500s vs verbose development 500s.

## Manual end-to-end demo workflow

With backend + frontend running:

1. Register an account → log in → refresh → verify the session restores
2. Open Dashboard → verify KPI cards, automation summary
3. Create a venture → verify 3 auto tasks + follow-up
4. Open Venture Details → complete a task → verify activity appears
5. Complete the follow-up → verify activity
6. Reschedule (via modal) → verify activity + synced date
7. Automation Center → Run Automation Now → verify result banner + history entry
8. Run again → verify no duplicate reminders for the same due date
9. Delete the venture → verify tasks/follow-up/activities are gone
10. Return to Dashboard → verify statistics updated
11. Log out → verify protected routes redirect to login; log back in
12. Also check: invalid form data (inline field errors), unknown URL (404 page), empty database states, mobile layout (390px), page refresh on every route

## Testing notes

- Tests run against `mongodb-memory-server`; no external database required.
- `db.mode` in tests reports `in-memory` — this is asserted to prove the system status endpoint is honest.
- The cron job is **not** started in tests (asserted: `cronScheduled: false`); automation is exercised through the manual endpoint, which shares the same service function.
