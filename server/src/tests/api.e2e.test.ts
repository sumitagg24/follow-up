import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";

let mongod: MongoMemoryServer;
let app: any;
let auth: { Authorization: string };

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
  // Register a test account and reuse its token for every API call.
  const reg = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test Operator", email: "operator@test.dev", password: "password123" });
  expect(reg.status).toBe(201);
  auth = { Authorization: `Bearer ${reg.body.token}` };
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const todayStr = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

function offsetDate(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // midday avoids TZ edge cases
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function createVenture(overrides: Record<string, unknown> = {}) {
  const payload = {
    name: "Nova AI",
    founderName: "Rahul Sharma",
    founderEmail: "rahul@example.com",
    industry: "AI & Machine Learning",
    status: "Evaluation",
    followUpDate: offsetDate(0),
    notes: "test",
    ...overrides,
  };
  const res = await request(app).post("/api/ventures").set(auth).send(payload);
  return res;
}

async function clearAll() {
  await Promise.all([
    Venture.deleteMany({}), FollowUp.deleteMany({}), Task.deleteMany({}), Activity.deleteMany({}),
  ]);
}

describe("validation & error handling", () => {
  it("400 with details for missing/invalid venture fields", async () => {
    const res = await request(app).post("/api/ventures").set(auth).send({ name: "", founderEmail: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThanOrEqual(4);
  });

  it("400 for invalid follow-up date", async () => {
    const res = await createVenture({ followUpDate: "not-a-date" });
    expect(res.status).toBe(400);
    expect(res.body.details.join(" ")).toMatch(/date/i);
  });

  it("400 for invalid venture id format", async () => {
    const res = await request(app).get("/api/ventures/not-an-id").set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid venture id/i);
  });

  it("404 for missing venture", async () => {
    const res = await request(app).get(`/api/ventures/${new mongoose.Types.ObjectId().toHexString()}`).set(auth);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("JSON 404 for unknown API path", async () => {
    const res = await request(app).get("/api/does-not-exist").set(auth);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe("Step 6 end-to-end demo workflow", () => {
  let ventureId: string;

  it("1. Create venture → 3 tasks auto-created + follow-up created", async () => {
    await clearAll();
    const res = await createVenture();
    expect(res.status).toBe(201);
    ventureId = res.body.venture._id;
    expect(res.body.tasks).toHaveLength(3);
    expect(res.body.followUp.status).toBe("pending");

    const detail = await request(app).get(`/api/ventures/${ventureId}`).set(auth);
    expect(detail.body.tasks).toHaveLength(3);
    expect(detail.body.followUp).toBeTruthy();
    const actions = detail.body.activities.map((a: any) => a.action);
    expect(actions).toContain("venture_created");
    expect(actions.filter((a: string) => a === "task_created")).toHaveLength(3);
  });

  it("2. Dashboard reflects the new venture", async () => {
    const res = await request(app).get("/api/dashboard").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.stats.totalVentures).toBe(1);
    expect(res.body.stats.todaysFollowUps).toBe(1);
    expect(res.body.todaysFollowUps.length).toBeGreaterThanOrEqual(1);
  });

  it("3. Complete a task → activity generated", async () => {
    const detail = await request(app).get(`/api/ventures/${ventureId}`).set(auth);
    const taskId = detail.body.tasks[0]._id;

    const done = await request(app).put(`/api/tasks/${taskId}/complete`).set(auth);
    expect(done.status).toBe(200);
    expect(done.body.status).toBe("completed");

    // idempotent: second complete adds no duplicate activity
    await request(app).put(`/api/tasks/${taskId}/complete`).set(auth);
    const acts = await Activity.find({ ventureId, action: "task_completed" });
    expect(acts).toHaveLength(1);
  });

  it("4. Reschedule follow-up → activity generated, venture date synced", async () => {
    const detail = await request(app).get(`/api/ventures/${ventureId}`).set(auth);
    const fuId = detail.body.followUp._id;
    const newDate = offsetDate(7);

    const res = await request(app).put(`/api/followups/${fuId}/reschedule`).set(auth).send({ dueDate: newDate });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");

    const v = await Venture.findById(ventureId);
    expect(new Date(v!.followUpDate).toISOString().slice(0, 10)).toBe(newDate);

    const acts = await Activity.find({ ventureId, action: "followup_rescheduled" });
    expect(acts).toHaveLength(1);
  });

  it("5. Overdue follow-up → Run Automation → reminder + dev email + activity, no duplicates on re-run", async () => {
    // Make it overdue directly
    const yesterday = offsetDate(-1);
    await FollowUp.updateOne({ ventureId }, { dueDate: new Date(yesterday), status: "pending" });

    const run1 = await request(app).post("/api/automation/check-followups").set(auth);
    expect(run1.status).toBe(200);
    expect(run1.body.overdueFound).toBe(1);
    expect(run1.body.remindersGenerated).toBe(1);
    expect(run1.body.emailsSent).toBe(0); // no SMTP in tests → dev log

    const fu = await FollowUp.findOne({ ventureId });
    expect(fu!.status).toBe("overdue");

    // Run again → no duplicate reminder
    const run2 = await request(app).post("/api/automation/check-followups").set(auth);
    expect(run2.body.remindersGenerated).toBe(0);

    const reminders = await Activity.find({ ventureId, action: "reminder_generated" });
    expect(reminders).toHaveLength(1);
    const devEmails = await Activity.find({ ventureId, action: "reminder_email_dev" });
    expect(devEmails).toHaveLength(1);
  });

  it("6. Delete venture → cascade removes tasks, follow-up, activities", async () => {
    const res = await request(app).delete(`/api/ventures/${ventureId}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(await Venture.findById(ventureId)).toBeNull();
    expect(await Task.find({ ventureId })).toHaveLength(0);
    expect(await FollowUp.find({ ventureId })).toHaveLength(0);
    expect(await Activity.find({ ventureId })).toHaveLength(0);
  });
});

describe("dashboard v2, analytics, system & automation history", () => {
  it("dashboard exposes extended KPIs, overdue/upcoming lists and automation summary", async () => {
    await clearAll();
    await createVenture({ name: "Dash Venture", followUpDate: offsetDate(0) });

    const res = await request(app).get("/api/dashboard").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.stats).toMatchObject({ totalVentures: 1, activeVentures: 1, openTasks: 3, completedTasks: 0 });
    expect(res.body.todaysFollowUps).toHaveLength(1);
    expect(Array.isArray(res.body.overdueFollowUps)).toBe(true);
    expect(Array.isArray(res.body.upcomingFollowUps)).toBe(true);
    expect(res.body.lastAutomationRun).toBeNull();
  });

  it("analytics returns real aggregates with continuous 14-day axis", async () => {
    const res = await request(app).get("/api/analytics").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.venturesByStatus).toEqual(
      expect.arrayContaining([expect.objectContaining({ _id: "Evaluation", count: 1 })])
    );
    expect(res.body.taskStats).toEqual(
      expect.arrayContaining([expect.objectContaining({ _id: "pending", count: 3 })])
    );
    expect(res.body.activityVolume).toHaveLength(14);
    const totalActivity = res.body.activityVolume.reduce((s: number, d: any) => s + d.count, 0);
    expect(totalActivity).toBeGreaterThanOrEqual(4); // venture_created + 3 task_created
  });

  it("manual automation run is recorded in history and reported", async () => {
    // make the follow-up overdue, then run automation manually
    await FollowUp.updateOne({}, { dueDate: new Date(offsetDate(-1)), status: "pending" });
    const run = await request(app).post("/api/automation/check-followups").set(auth);
    expect(run.status).toBe(200);
    expect(run.body.triggeredBy).toBe("manual");
    expect(run.body.remindersGenerated).toBe(1);

    const dash = await request(app).get("/api/dashboard").set(auth);
    expect(dash.body.lastAutomationRun).toMatchObject({ triggeredBy: "manual", remindersGenerated: 1 });

    const history = await request(app).get("/api/activity?action=automation_run").set(auth);
    expect(history.status).toBe(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].meta.triggeredBy).toBe("manual");
  });

  it("system status reports honest db mode and email mode", async () => {
    const res = await request(app).get("/api/system").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.db.mode).toBe("in-memory"); // tests run against in-memory server
    expect(res.body.db.persistent).toBe(false);
    expect(res.body.email.mode).toBe("development-log"); // no SMTP in tests
    expect(res.body.automation.cronScheduled).toBe(false); // cron not started in tests
  });

  it("activity action filter rejects unknown actions", async () => {
    const res = await request(app).get("/api/activity?action=bogus").set(auth);
    expect(res.status).toBe(400);
  });

  it("ventures list includes task counts and follow-up", async () => {
    const res = await request(app).get("/api/ventures").set(auth);
    expect(res.status).toBe(200);
    const v = res.body[0];
    expect(v.taskCounts).toMatchObject({ total: 3, completed: 0 });
    expect(v.followUp).toBeTruthy();
  });

  it("tasks list populates venture info", async () => {
    const res = await request(app).get("/api/tasks").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    expect(res.body[0].ventureId).toMatchObject({ name: expect.any(String) });
  });
});

describe("task creation endpoint", () => {
  it("creates a task for an existing venture and logs activity", async () => {
    await clearAll();
    const created = await createVenture({ name: "PayFlux" });
    const vid = created.body.venture._id;

    const res = await request(app).post("/api/tasks").set(auth).send({ ventureId: vid, title: "Extra check-in", dueDate: offsetDate(3) });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Extra check-in");

    const acts = await Activity.find({ ventureId: vid, action: "task_created", description: /Extra check-in/ });
    expect(acts).toHaveLength(1);
  });

  it("400 for invalid task payload", async () => {
    const created = await createVenture({ name: "MediCore" });
    const vid = created.body.venture._id;
    const res = await request(app).post("/api/tasks").set(auth).send({ ventureId: vid, title: "" });
    expect(res.status).toBe(400);
  });
});
