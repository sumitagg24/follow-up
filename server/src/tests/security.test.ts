import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { getJwtSecret, requireEnv } from "../utils/env.js";
import { User } from "../models/User.js";

const savedEnv = { ...process.env };

/** Reset process.env to a snapshot (deleting anything added since). */
function restoreEnv(target: Record<string, string | undefined>) {
  for (const key of Object.keys(process.env)) {
    if (!(key in target)) delete (process.env as any)[key];
  }
  Object.assign(process.env, target);
}

describe("production env guards (pure)", () => {
  afterEach(() => restoreEnv(savedEnv));

  it("uses the dev JWT fallback outside production", () => {
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).toBe("dev-only-insecure-secret-change-me");
  });

  it("refuses to resolve a JWT secret in production when missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
  });

  it("refuses obviously-weak production secrets", () => {
    process.env.NODE_ENV = "production";
    for (const weak of ["secret", "password123", "dev-only-insecure-secret-change-me", "short"]) {
      process.env.JWT_SECRET = weak;
      expect(() => getJwtSecret()).toThrow(/too weak|not set/);
    }
  });

  it("accepts a strong production secret without exposing it", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "a".repeat(64);
    expect(getJwtSecret()).toBe("a".repeat(64));
  });

  it("requireEnv throws in production only when missing", () => {
    delete process.env.CLIENT_URL;
    expect(requireEnv("CLIENT_URL", "http://localhost:5173")).toBe("http://localhost:5173");
    process.env.NODE_ENV = "production";
    expect(() => requireEnv("CLIENT_URL", "http://localhost:5173")).toThrow(/CLIENT_URL is not set/);
  });
});

describe("production app behavior", () => {
  let mongod: MongoMemoryServer;
  let app: any;
  let token: string;
  let prodBaseline: Record<string, string | undefined> = {};

  beforeAll(async () => {
    process.env.NODE_ENV = "production";
    process.env.CLIENT_URL = "https://app.test.local";
    process.env.JWT_SECRET = "b".repeat(64);
    delete process.env.ALLOW_SEED;
    prodBaseline = { ...process.env };
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    app = createApp();
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ name: "Prod Tester", email: "prod@test.local", password: "password123" });
    expect(reg.status).toBe(201);
    token = reg.body.token;
  });

  afterEach(() => {
    restoreEnv(prodBaseline);
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
    restoreEnv(savedEnv);
  });

  it("serves baseline security headers and hides x-powered-by", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("keeps the seed endpoint auth-gated in production", async () => {
    const res = await request(app).post("/api/seed");
    expect(res.status).toBe(401);
  });

  it("blocks seeding in production without an explicit unlock", async () => {
    const res = await request(app).post("/api/seed").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/disabled in production/);
  });

  it("allows seeding in production only with ALLOW_SEED=true (dev seeding unaffected)", async () => {
    process.env.ALLOW_SEED = "true";
    const res = await request(app).post("/api/seed").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.seeded).toBe(6);
  });

  it("returns a generic 500 in production (no internals leak)", async () => {
    // findOne(...).lean() chain: fail at execution time like a real DB outage.
    vi.spyOn(User, "findOne").mockReturnValueOnce({
      lean: () => Promise.reject(new Error("mongodb exploded: mongodb://secret-host/db")),
    } as any);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "X", email: "x@test.local", password: "password123" });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });

  it("returns the real message in development 500s", async () => {
    process.env.NODE_ENV = "development";
    vi.spyOn(User, "findOne").mockReturnValueOnce({
      lean: () => Promise.reject(new Error("mongodb exploded")),
    } as any);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "X", email: "x@test.local", password: "password123" });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain("mongodb exploded");
  });
});
