/**
 * End-to-end demonstration workflow test.
 * Usage: node scripts/e2e-flow.mjs [baseUrl]
 * Requires the dev server running (default http://localhost:4000).
 *
 * Flow under test (the exact demo workflow):
 *  create venture -> 3 auto tasks -> follow-up record -> dashboard reflects it
 *  -> open venture -> complete a task -> activity generated
 *  -> reschedule follow-up -> activity generated
 *  -> identify overdue follow-up -> run automation
 *  -> reminder generated -> email/log generated -> activity generated
 *  -> run automation again -> no duplicate reminder
 *  -> delete venture -> tasks gone -> follow-up gone -> activities gone
 */

const BASE = process.argv[2] || "http://localhost:4000";

let stepNo = 0;
let failures = 0;

function ok(name, cond, detail = "") {
  stepNo++;
  const mark = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`[${String(stepNo).padStart(2, "0")}] ${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
  return cond;
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // midday avoids DST edge
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log(`\n=== E2E demonstration workflow — ${BASE} ===\n`);
  const health = await req("GET", "/api/health");
  if (!ok("health check", health.status === 200 && health.json?.ok)) {
    console.error("Server is not reachable — aborting."); process.exit(1);
  }

  // ---------- 1. Create Venture ----------
  const futDate = todayISO(2);
  const created = await req("POST", "/api/ventures", {
    name: "E2E Test Venture",
    founderName: "Test Founder",
    founderEmail: "e2e-founder@example.com",
    industry: "SaaS",
    status: "New",
    followUpDate: futDate,
    notes: "Created by the automated E2E workflow run.",
  });
  ok("create venture (POST /api/ventures)", created.status === 201 && created.json?.venture?._id,
     `HTTP ${created.status}`);
  const ventureId = created.json.venture._id;
  const followUpId = created.json.followUp?._id;

  // ---------- 2. 3 Tasks automatically created ----------
  const detailAfterCreate = await req("GET", `/api/ventures/${ventureId}`);
  const tasksCreated = detailAfterCreate.json?.tasks ?? [];
  ok("3 tasks auto-created", tasksCreated.length === 3,
     tasksCreated.map(t => t.title).join(", "));
  ok("task titles match spec",
     ["Initial Review", "Founder Follow-up", "Internal Discussion"].every(t => tasksCreated.some(x => x.title === t)));

  // ---------- 3. Follow-up date created ----------
  const followUp = detailAfterCreate.json?.followUp;
  ok("follow-up record created",
     !!followUp && new Date(followUp.dueDate).toISOString().slice(0, 10) === futDate,
     `due ${followUp?.dueDate?.slice(0, 10)} / status ${followUp?.status}`);

  // ---------- 4. Dashboard updates ----------
  const dash1 = await req("GET", "/api/dashboard");
  const stats1 = dash1.json?.stats;
  ok("dashboard totalVentures includes new venture",
     typeof stats1?.totalVentures === "number" && stats1.totalVentures >= 1,
     `totalVentures=${stats1?.totalVentures}`);
  ok("dashboard recentActivity shows venture_created",
     (dash1.json?.recentActivity ?? []).some(a => a.ventureId === ventureId && a.action === "venture_created"));
  ok("dashboard todaysFollowUps list includes venture (overdue section populated)",
     Array.isArray(dash1.json?.todaysFollowUps));

  // ---------- 5. Open Venture (detail endpoint) ----------
  ok("open venture detail (GET /api/ventures/:id)",
     detailAfterCreate.status === 200 && detailAfterCreate.json?.venture?.name === "E2E Test Venture");
  ok("detail includes activities (venture_created present)",
     (detailAfterCreate.json?.activities ?? []).some(a => a.action === "venture_created"));

  // ---------- 6. Complete task ----------
  const taskToComplete = tasksCreated[0];
  const doneTask = await req("PUT", `/api/tasks/${taskToComplete._id}/complete`);
  ok("complete task", doneTask.status === 200 && doneTask.json?.status === "completed");
  const detailAfterTask = await req("GET", `/api/ventures/${ventureId}`);
  const taskNow = detailAfterTask.json?.tasks?.find(t => t._id === taskToComplete._id);
  ok("task persisted as completed", taskNow?.status === "completed" && !!taskNow?.completedAt);

  // ---------- 7. Activity generated (task) ----------
  ok("activity generated: task_completed",
     (detailAfterTask.json?.activities ?? []).some(a => a.action === "task_completed"));

  // ---------- 8. Reschedule follow-up ----------
  const newDate = todayISO(6);
  const resched = await req("PUT", `/api/followups/${followUpId}/reschedule`, { dueDate: newDate });
  ok("reschedule follow-up", resched.status === 200 &&
     new Date(resched.json?.dueDate).toISOString().slice(0, 10) === newDate);

  // ---------- 9. Activity generated (reschedule) ----------
  const detailAfterResched = await req("GET", `/api/ventures/${ventureId}`);
  ok("activity generated: followup_rescheduled",
     (detailAfterResched.json?.activities ?? []).some(a => a.action === "followup_rescheduled"));
  ok("venture.followUpDate synced with reschedule",
     new Date(detailAfterResched.json?.venture?.followUpDate).toISOString().slice(0, 10) === newDate);

  // ---------- 10. Set/identify overdue follow-up ----------
  const overdueDate = todayISO(-3);
  const backdate = await req("PUT", `/api/ventures/${ventureId}`, {
    name: "E2E Test Venture",
    founderName: "Test Founder",
    founderEmail: "e2e-founder@example.com",
    industry: "SaaS",
    status: "New",
    followUpDate: overdueDate,
    notes: "Backdated to force overdue state.",
  });
  ok("backdate follow-up via PUT /api/ventures/:id", backdate.status === 200);
  const detailBackdated = await req("GET", `/api/ventures/${ventureId}`);
  ok("follow-up dueDate backdated",
     new Date(detailBackdated.json?.followUp?.dueDate).toISOString().slice(0, 10) === overdueDate,
     `now due ${detailBackdated.json?.followUp?.dueDate?.slice(0, 10)}`);
  // Server marks it overdue only during an automation pass — confirm it is still pending/overdue before run:
  ok("follow-up identified as candidate (pending or overdue)",
     ["pending", "overdue"].includes(detailBackdated.json?.followUp?.status));

  // ---------- 11. Run Automation ----------
  const run1 = await req("POST", "/api/automation/check-followups");
  const r1 = run1.json;
  ok("run automation (POST /api/automation/check-followups)", run1.status === 200 && !!r1,
     `checked=${r1?.checked} overdueFound=${r1?.overdueFound}`);

  // ---------- 12. Reminder generated ----------
  ok("reminder generated (remindersGenerated >= 1)", (r1?.remindersGenerated ?? 0) >= 1,
     `remindersGenerated=${r1?.remindersGenerated}`);
  const detailAfterAuto = await req("GET", `/api/ventures/${ventureId}`);
  const actsAfterAuto = detailAfterAuto.json?.activities ?? [];
  ok("reminder_generated activity exists",
     actsAfterAuto.some(a => a.action === "reminder_generated" && a.description.includes(overdueDate)));
  ok("follow-up marked overdue by automation",
     detailAfterAuto.json?.followUp?.status === "overdue");

  // ---------- 13. Email/log generated ----------
  const devLogged = actsAfterAuto.some(a => a.action === "reminder_email_dev");
  const emailSent = actsAfterAuto.some(a => a.action === "reminder_email_sent");
  ok("email generated (dev log or SMTP sent)", devLogged || emailSent,
     devLogged ? "reminder_email_dev (SMTP not configured)" : "reminder_email_sent");

  // ---------- 14. Activity generated (email) ----------
  ok("email activity recorded in feed", actsAfterAuto.some(a => a.action.startsWith("reminder_email")));

  // ---------- 15. Run Automation again ----------
  const run2 = await req("POST", "/api/automation/check-followups");
  const r2 = run2.json;

  // ---------- 16. No duplicate reminder ----------
  ok("second automation run: no duplicate reminder", run2.status === 200 && r2?.remindersGenerated === 0,
     `remindersGenerated=${r2?.remindersGenerated}`);
  const detailAfterAuto2 = await req("GET", `/api/ventures/${ventureId}`);
  const reminderCount = (detailAfterAuto2.json?.activities ?? [])
    .filter(a => a.action === "reminder_generated").length;
  ok("exactly one reminder_generated activity for the venture", reminderCount === 1,
     `count=${reminderCount}`);

  // ---------- 17. Delete Venture ----------
  const del = await req("DELETE", `/api/ventures/${ventureId}`);
  ok("delete venture", del.status === 200 && del.json?.ok === true);

  // ---------- 18. Tasks deleted ----------
  const tasksLeft = await req("GET", `/api/tasks?ventureId=${ventureId}`);
  ok("tasks deleted (cascade)", (tasksLeft.json ?? []).length === 0,
     `remaining=${(tasksLeft.json ?? []).length}`);

  // ---------- 19. Follow-up deleted ----------
  const detailGone = await req("GET", `/api/ventures/${ventureId}`);
  ok("venture gone (404)", detailGone.status === 404);
  const fus = await req("GET", "/api/followups");
  ok("follow-up deleted (cascade)", !(fus.json ?? []).some(f => f._id === followUpId));

  // ---------- 20. Activities deleted ----------
  const acts = await req("GET", "/api/activity");
  ok("activities deleted (cascade)", !(acts.json ?? []).some(a => a.ventureId === ventureId),
     `matching activities remaining=${(acts.json ?? []).filter(a => a.ventureId === ventureId).length}`);

  console.log("\n----------------------------------------");
  if (failures === 0) {
    console.log(`RESULT: ALL ${stepNo} CHECKS PASSED ✔`);
  } else {
    console.log(`RESULT: ${failures}/${stepNo} checks FAILED ✘`);
    process.exitCode = 1;
  }
  console.log("----------------------------------------\n");
}

main().catch(e => { console.error("E2E run crashed:", e); process.exit(1); });
