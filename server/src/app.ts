import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import ventureRoutes from "./routes/ventures.js";
import followUpRoutes from "./routes/followups.js";
import taskRoutes from "./routes/tasks.js";
import activityRoutes from "./routes/activity.js";
import dashboardRoutes from "./routes/dashboard.js";
import automationRoutes from "./routes/automation.js";
import analyticsRoutes from "./routes/analytics.js";
import systemRoutes from "./routes/system.js";
import authRoutes from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { isProduction, requireEnv } from "./utils/env.js";
import { HttpError } from "./utils/http.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);
  // In production CLIENT_URL must be explicit — never silently allow a
  // localhost default on a public deployment. Development keeps the default.
  const clientUrl = requireEnv("CLIENT_URL", "http://localhost:5173");
  app.use(cors({ origin: clientUrl }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  // Auth endpoints are public; everything below /api requires a session token.
  app.use("/api/auth", authRoutes);
  app.use(requireAuth);

  app.use("/api/ventures", ventureRoutes);
  app.use("/api/followups", followUpRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/activity", activityRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/automation", automationRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/system", systemRoutes);

  // Dev seed endpoint. Always requires a session token (registered after
  // requireAuth), AND is disabled in production unless explicitly unlocked
  // with ALLOW_SEED=true — so demo data can never be created on a public
  // deployment by accident. Development seeding is unaffected.
  // Do not move this above the auth middleware.
  app.post("/api/seed", async (req, res, next) => {
    if (isProduction() && process.env.ALLOW_SEED !== "true") {
      res.status(403).json({ error: "Seed endpoint is disabled in production" });
      return;
    }
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
    } catch (e) { next(e); }
  });

  // Unknown API path → JSON 404 (not an HTML error page)
  app.use("/api", (req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
  });

  // Central error handler — every failure returns { error: string } with a predictable status.
  // In production, unexpected failures return a generic message so stack
  // traces, MongoDB internals, paths, and env values never leak to clients.
  // Details are logged server-side only.
  app.use((err: any, req: any, res: any, next: any) => {
    if (res.headersSent) return next(err);
    if (err instanceof HttpError) {
      const body: any = { error: err.message };
      if (err.details?.length) body.details = err.details;
      return res.status(err.status).json(body);
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.name === "CastError") {
      return res.status(400).json({ error: `Invalid id: ${err.value}` });
    }
    if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    console.error("[ERROR]", req.method, req.originalUrl, err);
    const message = isProduction() ? "Internal server error" : (err?.message || "Internal server error");
    res.status(500).json({ error: message });
  });

  return app;
}
