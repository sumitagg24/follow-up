import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/http.js";
import { runtime } from "../utils/runtime.js";

export const getSystemStatus = asyncHandler(async (req: Request, res: Response) => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

  // Derive live state from the actual connection; runtime.dbMode records how we booted.
  const connected = mongoose.connection.readyState === 1;
  const persistent = runtime.dbMode === "mongodb" || Boolean(process.env.MONGODB_URI) && connected && !mongoose.connection.name.includes("mongodb-memory-server");
  const mode = !connected ? "disconnected" : persistent ? "mongodb" : runtime.dbMode === "in-memory" || runtime.dbMode === "unset" ? "in-memory" : "mongodb";

  res.json({
    db: {
      mode,
      persistent,
      connected,
      name: mongoose.connection.name || null,
    },
    email: {
      smtpConfigured,
      mode: smtpConfigured ? "smtp" : "development-log",
    },
    automation: {
      cronScheduled: runtime.cronScheduled,
      schedule: "0 9 * * * (daily 09:00)",
    },
    uptimeSeconds: Math.floor((Date.now() - runtime.startedAt.getTime()) / 1000),
    version: "1.0.0",
  });
});
