import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import ventureRoutes from "./routes/ventures.js";
import followUpRoutes from "./routes/followups.js";
import taskRoutes from "./routes/tasks.js";
import activityRoutes from "./routes/activity.js";
import dashboardRoutes from "./routes/dashboard.js";
import automationRoutes from "./routes/automation.js";
import { startCron } from "./jobs/cron.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/ventures", ventureRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/automation", automationRoutes);

// dev seed endpoint (no auth — MVP)
app.post("/api/seed", async (req, res) => {
  try {
    const { Venture } = await import("./models/Venture.js");
    const { FollowUp } = await import("./models/FollowUp.js");
    const { Task } = await import("./models/Task.js");
    const { Activity } = await import("./models/Activity.js");
    const { createActivity } = await import("./services/automationService.js");
    await Venture.deleteMany({});
    await FollowUp.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    const venturesSeed = [
      { name: "Nova AI", founderName: "Rahul Sharma", founderEmail: "rahul@nova-ai.demo", industry: "AI & Machine Learning", status: "Evaluation", offset: 0 },
      { name: "PayFlux", founderName: "Aisha Khan", founderEmail: "aisha@payflux.demo", industry: "FinTech", status: "Active", offset: -2 },
      { name: "MediCore", founderName: "David Chen", founderEmail: "david@medicore.demo", industry: "HealthTech", status: "Review", offset: 1 },
      { name: "CloudSprint", founderName: "Emma Wilson", founderEmail: "emma@cloudsprint.demo", industry: "SaaS", status: "New", offset: 3 },
      { name: "GreenLoop", founderName: "Carlos Rivera", founderEmail: "carlos@greenloop.demo", industry: "ClimateTech", status: "Active", offset: -1 },
      { name: "DevForge", founderName: "Priya Patel", founderEmail: "priya@devforge.demo", industry: "Developer Tools", status: "Closed", offset: 0, completed: true },
    ];
    const today = new Date(); today.setHours(0,0,0,0);
    for (const s of venturesSeed) {
      const due = new Date(today); due.setDate(today.getDate() + s.offset);
      const v = await Venture.create({ name: s.name, founderName: s.founderName, founderEmail: s.founderEmail, industry: s.industry, status: s.status as any, followUpDate: due, notes: `Demo venture for ${s.name} in ${s.industry}.` });
      const fuStatus = s.completed ? "completed" : (s.offset < 0 ? "overdue" : "pending");
      await FollowUp.create({ ventureId: v._id, dueDate: due, status: fuStatus as any, completedAt: s.completed ? new Date() : null });
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
    res.json({ ok: true, seeded: 6 });
  } catch (e:any) { console.error(e); res.status(500).json({ error: e.message }); }
});

// error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal error" });
});

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log("[DB] Connected to MongoDB");
      return;
    } catch (e) {
      console.error("[DB] Failed to connect with MONGODB_URI, falling back to in-memory:", e);
    }
  }
  console.log("[DB] Starting in-memory MongoDB (no MONGODB_URI or connection failed) — data will not persist");
  const mongod = await MongoMemoryServer.create();
  const memUri = mongod.getUri();
  await mongoose.connect(memUri);
  console.log("[DB] Connected to in-memory MongoDB");
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] Listening on http://localhost:${PORT}`);
    startCron();
  });
}).catch(e=>{
  console.error("[FATAL] DB connection failed", e);
  process.exit(1);
});
