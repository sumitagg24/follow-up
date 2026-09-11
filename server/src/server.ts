import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "./app.js";
import { startCron } from "./jobs/cron.js";
import { runtime } from "./utils/runtime.js";
import { isProduction } from "./utils/env.js";

const PORT = Number(process.env.PORT) || 4000;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri && isProduction()) {
    throw new Error("[FATAL] MONGODB_URI is not set. Production requires persistent MongoDB — refusing to boot on the in-memory fallback.");
  }
  if (uri) {
    try {
      await mongoose.connect(uri);
      runtime.dbMode = "mongodb";
      console.log("[DB] Connected to MongoDB (persistent)");
      return;
    } catch (e) {
      // A configured-but-unreachable database in production is an outage, not
      // a reason to silently switch to throwaway storage. Fail fast.
      if (isProduction()) {
        throw new Error(`[FATAL] Could not connect to MongoDB via MONGODB_URI. Refusing to boot in production. ${e}`);
      }
      console.error("[DB] Failed to connect with MONGODB_URI, falling back to in-memory:", e);
    }
  }
  console.log("[DB] Starting in-memory MongoDB (no MONGODB_URI or connection failed) — data will not persist");
  const mongod = await MongoMemoryServer.create();
  const memUri = mongod.getUri();
  await mongoose.connect(memUri);
  runtime.dbMode = "in-memory";
  console.log("[DB] Connected to in-memory MongoDB");
}

connectDB().then(() => {
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[SERVER] Listening on http://localhost:${PORT}`);
    startCron();
  });

  // Graceful shutdown: stop accepting connections, close DB, exit
  function shutdown(signal: string) {
    console.log(`[SERVER] ${signal} received — shutting down`);
    server.close(async () => {
      try { await mongoose.disconnect(); } catch {}
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}).catch(e=>{
  console.error("[FATAL] DB connection failed", e);
  process.exit(1);
});
