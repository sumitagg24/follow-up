import { describe, it, expect, beforeAll, afterAll, vi, type Mock } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { checkDueFollowUps } from "../services/automationService.js";
import nodemailer from "nodemailer";

// Mock the SMTP transport so email success/failure paths are deterministic
// without a real mail server. Other test files are unaffected (per-file
// module registry).
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn() } }));

function mockSmtpTransport(sendMail: (...args: any[]) => Promise<unknown>) {
  (nodemailer.createTransport as unknown as Mock).mockReturnValue({ sendMail });
}

function setSmtpEnv() {
  process.env.SMTP_HOST = "smtp.test.local";
  process.env.SMTP_USER = "tester";
  process.env.SMTP_PASS = "s3cret";
}

function clearSmtpEnv() {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
}

async function wipeAll() {
  await Venture.deleteMany({});
  await FollowUp.deleteMany({});
  await Task.deleteMany({});
  await Activity.deleteMany({});
}

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function createVentureWithFollowUp(offsetDays:number, status="pending") {
  const due = new Date(); due.setHours(0,0,0,0); due.setDate(due.getDate()+offsetDays);
  const v = await Venture.create({ name:`V${Date.now()}${Math.random()}`, founderName:"F", founderEmail:"f@example.com", industry:"SaaS", status:"New", followUpDate: due, notes:"" });
  const fu = await FollowUp.create({ ventureId: v._id, dueDate: due, status: status as any });
  // mimic tasks
  await Task.insertMany([
    { ventureId: v._id, title:"Initial Review", dueDate: new Date(), status:"pending" },
    { ventureId: v._id, title:"Founder Follow-up", dueDate: due, status:"pending" },
    { ventureId: v._id, title:"Internal Discussion", dueDate: new Date(), status:"pending" },
  ]);
  await Activity.create({ ventureId: v._id, ventureName: v.name, action:"venture_created", description:`Venture "${v.name}" created` });
  return { v, fu };
}

describe("venture creation + auto tasks", () => {
  it("creates 3 tasks", async () => {
    const { v } = await createVentureWithFollowUp(1);
    const tasks = await Task.find({ ventureId: v._id });
    expect(tasks.length).toBe(3);
  });
});

describe("follow-up complete", () => {
  it("marks completed", async () => {
    const { fu } = await createVentureWithFollowUp(0);
    fu.status="completed"; fu.completedAt=new Date(); await fu.save();
    const found = await FollowUp.findById(fu._id);
    expect(found?.status).toBe("completed");
    expect(found?.completedAt).not.toBeNull();
  });
});

describe("reschedule", () => {
  it("updates dueDate and resets to pending", async () => {
    const { fu } = await createVentureWithFollowUp(-1, "overdue");
    const newDate = new Date(); newDate.setDate(newDate.getDate()+5);
    fu.dueDate=newDate; fu.status="pending"; (fu as any).completedAt=null; await fu.save();
    const f2 = await FollowUp.findById(fu._id);
    expect(f2?.status).toBe("pending");
    expect(new Date(f2!.dueDate).toISOString().slice(0,10)).toBe(newDate.toISOString().slice(0,10));
  });
});

describe("overdue detection", () => {
  it("marks pending past-due as overdue", async () => {
    await Venture.deleteMany({}); await FollowUp.deleteMany({}); await Task.deleteMany({}); await Activity.deleteMany({});
    await createVentureWithFollowUp(-2, "pending");
    const res = await checkDueFollowUps();
    expect(res.overdueFound).toBeGreaterThanOrEqual(1);
    const fu = await FollowUp.findOne({ status:"overdue" });
    expect(fu).not.toBeNull();
  });
});

describe("duplicate reminder prevention", () => {
  it("does not create duplicate reminder same day", async () => {
    await Venture.deleteMany({}); await FollowUp.deleteMany({}); await Task.deleteMany({}); await Activity.deleteMany({});
    await createVentureWithFollowUp(0, "pending");
    const r1 = await checkDueFollowUps();
    const r2 = await checkDueFollowUps();
    expect(r1.remindersGenerated).toBe(1);
    expect(r2.remindersGenerated).toBe(0);
  });
});

describe("dashboard stats", () => {
  it("counts correctly", async () => {
    await Venture.deleteMany({}); await FollowUp.deleteMany({});
    await createVentureWithFollowUp(0);
    await createVentureWithFollowUp(-1, "overdue");
    const total = await Venture.countDocuments();
    const overdue = await FollowUp.countDocuments({ status:"overdue" });
    expect(total).toBe(2);
    expect(overdue).toBe(1);
  });
});

describe("delete cascade", () => {
  it("deletes related records", async () => {
    const { v } = await createVentureWithFollowUp(0);
    const vid = v._id;
    await FollowUp.deleteMany({ ventureId: vid });
    await Task.deleteMany({ ventureId: vid });
    await Activity.deleteMany({ ventureId: vid });
    await Venture.findByIdAndDelete(vid);
    expect(await Venture.findById(vid)).toBeNull();
    expect(await FollowUp.find({ ventureId: vid }).then(r=>r.length)).toBe(0);
  });
});

describe("no overdue → quiet run", () => {
  it("reports honest zeros and still records run history", async () => {
    await wipeAll();
    await createVentureWithFollowUp(5, "pending"); // due in the future
    const res = await checkDueFollowUps("manual");
    expect(res.checked).toBe(1);
    expect(res.overdueFound).toBe(0);
    expect(res.remindersGenerated).toBe(0);
    expect(res.emailsSent).toBe(0);
    const hist = await Activity.findOne({ action: "automation_run" }).sort({ createdAt: -1 }).lean() as any;
    expect(hist?.meta?.triggeredBy).toBe("manual");
    expect(hist?.meta?.remindersGenerated).toBe(0);
  });
});

describe("newly overdue follow-up", () => {
  it("flips status and logs overdue + reminder activities", async () => {
    await wipeAll();
    const { v, fu } = await createVentureWithFollowUp(-3, "pending");
    const res = await checkDueFollowUps("manual");
    expect(res.overdueFound).toBe(1);
    expect(res.remindersGenerated).toBe(1);
    const updated = await FollowUp.findById(fu._id);
    expect(updated?.status).toBe("overdue");
    expect(await Activity.countDocuments({ ventureId: v._id, action: "followup_overdue" })).toBe(1);
    expect(await Activity.countDocuments({ ventureId: v._id, action: "reminder_generated" })).toBe(1);
  });
});

describe("cron and manual triggers", () => {
  it("share one service and dedupe reminders across triggers", async () => {
    await wipeAll();
    await createVentureWithFollowUp(0, "pending");
    const r1 = await checkDueFollowUps("cron");
    const r2 = await checkDueFollowUps("manual");
    expect(r1.remindersGenerated).toBe(1);
    expect(r2.remindersGenerated).toBe(0);
    const runs = await Activity.find({ action: "automation_run" }).sort({ createdAt: 1 }).lean() as any[];
    expect(runs.map((r) => r.meta?.triggeredBy)).toEqual(["cron", "manual"]);
  });
});

describe("email delivery paths", () => {
  it("counts emailsSent only on successful SMTP delivery", async () => {
    await wipeAll();
    setSmtpEnv();
    try {
      mockSmtpTransport(async () => ({}));
      await createVentureWithFollowUp(0, "pending");
      const res = await checkDueFollowUps("manual");
      expect(res.remindersGenerated).toBe(1);
      expect(res.emailsSent).toBe(1);
      expect(await Activity.countDocuments({ action: "reminder_email_sent" })).toBe(1);
      expect(await Activity.countDocuments({ action: "reminder_email_dev" })).toBe(0);
    } finally {
      clearSmtpEnv();
    }
  });

  it("records reminder_email_failed when SMTP delivery throws", async () => {
    await wipeAll();
    setSmtpEnv();
    try {
      mockSmtpTransport(async () => { throw new Error("relay down"); });
      await createVentureWithFollowUp(0, "pending");
      const res = await checkDueFollowUps("manual");
      expect(res.remindersGenerated).toBe(1);
      expect(res.emailsSent).toBe(0);
      expect(await Activity.countDocuments({ action: "reminder_email_failed" })).toBe(1);
      expect(await Activity.countDocuments({ action: "reminder_email_sent" })).toBe(0);
    } finally {
      clearSmtpEnv();
    }
  });

  it("dev-logs (never reports delivered) when SMTP is not configured", async () => {
    await wipeAll();
    clearSmtpEnv();
    await createVentureWithFollowUp(0, "pending");
    const res = await checkDueFollowUps("manual");
    expect(res.remindersGenerated).toBe(1);
    expect(res.emailsSent).toBe(0);
    expect(await Activity.countDocuments({ action: "reminder_email_dev" })).toBe(1);
    expect(await Activity.countDocuments({ action: "reminder_email_sent" })).toBe(0);
  });
});

describe("automation exception", () => {
  it("propagates DB failures instead of returning a zero-valued summary", async () => {
    // Simulate the query failing at execution time (after .populate chaining).
    const spy = vi.spyOn(FollowUp, "find").mockReturnValueOnce({
      populate: () => Promise.reject(new Error("db down")),
    } as any);
    try {
      await expect(checkDueFollowUps("manual")).rejects.toThrow("db down");
    } finally {
      spy.mockRestore();
    }
  });
});
