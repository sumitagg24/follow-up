import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Venture } from "../models/Venture.js";
import { FollowUp } from "../models/FollowUp.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { checkDueFollowUps } from "../services/automationService.js";

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
