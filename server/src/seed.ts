import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Venture } from "./models/Venture.js";
import { FollowUp } from "./models/FollowUp.js";
import { Task } from "./models/Task.js";
import { Activity } from "./models/Activity.js";
import { createActivity } from "./services/automationService.js";

const venturesSeed = [
  { name: "Nova AI", founderName: "Rahul Sharma", founderEmail: "rahul@nova-ai.demo", industry: "AI & Machine Learning", status: "Evaluation", offset: 0 },
  { name: "PayFlux", founderName: "Aisha Khan", founderEmail: "aisha@payflux.demo", industry: "FinTech", status: "Active", offset: -2 },
  { name: "MediCore", founderName: "David Chen", founderEmail: "david@medicore.demo", industry: "HealthTech", status: "Review", offset: 1 },
  { name: "CloudSprint", founderName: "Emma Wilson", founderEmail: "emma@cloudsprint.demo", industry: "SaaS", status: "New", offset: 3 },
  { name: "GreenLoop", founderName: "Carlos Rivera", founderEmail: "carlos@greenloop.demo", industry: "ClimateTech", status: "Active", offset: -1 },
  { name: "DevForge", founderName: "Priya Patel", founderEmail: "priya@devforge.demo", industry: "Developer Tools", status: "Closed", offset: 0, completed: true },
];

async function connect() {
  if (process.env.MONGODB_URI) {
    try { await mongoose.connect(process.env.MONGODB_URI); console.log("Connected to MONGODB_URI"); return; } catch {}
  }
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log("Connected to in-memory for seed - NOTE: if server is using file memory, this seed is separate. Use API or set MONGODB_URI to share DB.");
  console.log("MONGODB_URI not set, seed used temporary DB. For persistent seed, set MONGODB_URI to a real MongoDB and re-run.");
}

async function seed() {
  await connect();
  // If we are connected to a real URI or same memory? simplest we clear and insert.
  // To make demo useful when using in-memory dev server, we will seed via API is better.
  // Here we insert directly.
  await Venture.deleteMany({});
  await FollowUp.deleteMany({});
  await Task.deleteMany({});
  await Activity.deleteMany({});

  const today = new Date(); today.setHours(0,0,0,0);
  for (const s of venturesSeed) {
    const due = new Date(today); due.setDate(today.getDate() + s.offset);
    const v = await Venture.create({
      name: s.name,
      founderName: s.founderName,
      founderEmail: s.founderEmail,
      industry: s.industry,
      status: s.status as any,
      followUpDate: due,
      notes: `Demo venture for ${s.name} in ${s.industry}.`,
    });
    const fuStatus = s.completed ? "completed" : (s.offset < 0 ? "overdue" : s.offset === 0 ? "pending" : "pending");
    const fu = await FollowUp.create({
      ventureId: v._id,
      dueDate: due,
      status: fuStatus as any,
      completedAt: s.completed ? new Date() : null,
    });
    const tasks = await Task.insertMany([
      { ventureId: v._id, title: "Initial Review", status: s.completed ? "completed" : "pending", dueDate: new Date(today.getTime()+2*86400000) },
      { ventureId: v._id, title: "Founder Follow-up", status: s.completed ? "completed" : "pending", dueDate: due },
      { ventureId: v._id, title: "Internal Discussion", status: s.completed ? "completed" : "pending", dueDate: new Date(today.getTime()+5*86400000) },
    ]);
    await createActivity(v._id, v.name, "venture_created", `Venture "${v.name}" created`);
    for (const t of tasks) await createActivity(v._id, v.name, "task_created", `${t.title} task created for "${v.name}"`);
    if (s.completed) await createActivity(v._id, v.name, "followup_completed", `Follow-up completed for "${v.name}"`);
    if (fuStatus==="overdue") await createActivity(v._id, v.name, "followup_overdue", `Follow-up for "${v.name}" is overdue`);
  }
  console.log("Seeded 6 ventures");
  // print stats
  const stats = {
    ventures: await Venture.countDocuments(),
    followUps: await FollowUp.countDocuments(),
    tasks: await Task.countDocuments(),
    activities: await Activity.countDocuments(),
  };
  console.log(stats);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e=>{ console.error(e); process.exit(1); });
