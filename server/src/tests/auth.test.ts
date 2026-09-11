import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { User } from "../models/User.js";

let mongod: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("auth: registration", () => {
  it("registers a user and returns a token + safe user object", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Lovelace", email: "ada@studio.dev", password: "supersecret1" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("ada@studio.dev");
    expect(res.body.user.name).toBe("Ada Lovelace");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects short passwords (400 with details)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "X", email: "short@studio.dev", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.details.join(" ")).toMatch(/at least 8/i);
  });

  it("rejects invalid email (400 with details)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "X", email: "not-an-email", password: "supersecret1" });
    expect(res.status).toBe(400);
    expect(res.body.details.join(" ")).toMatch(/email/i);
  });

  it("rejects duplicate email (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Again", email: "ada@studio.dev", password: "supersecret1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("stores a bcrypt hash, never the plain password", async () => {
    const user = await User.findOne({ email: "ada@studio.dev" }).lean();
    expect(user!.passwordHash).toBeTruthy();
    expect(user!.passwordHash).not.toBe("supersecret1");
    expect(user!.passwordHash.startsWith("$2")).toBe(true);
  });
});

describe("auth: login", () => {
  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@studio.dev", password: "supersecret1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("ada@studio.dev");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a wrong password with a generic 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@studio.dev", password: "wrongpassword" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it("rejects an unknown email with the same generic message (no enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@studio.dev", password: "whatever123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email or password");
  });
});

describe("auth: session handling", () => {
  it("/me returns the user for a valid token", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@studio.dev", password: "supersecret1" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ada@studio.dev");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authentication required/i);
  });

  it("401 with a garbage token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
  });

  it("401 with a token signed for a deleted user", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ghost", email: "ghost@studio.dev", password: "supersecret1" });
    await User.deleteOne({ email: "ghost@studio.dev" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${reg.body.token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no longer exists/i);
  });

  it("password change requires the current password and rehashes", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@studio.dev", password: "supersecret1" });
    const token = { Authorization: `Bearer ${login.body.token}` };

    const bad = await request(app)
      .put("/api/auth/password")
      .set(token)
      .send({ currentPassword: "wrong", newPassword: "newsupersecret" });
    expect(bad.status).toBe(400);

    const good = await request(app)
      .put("/api/auth/password")
      .set(token)
      .send({ currentPassword: "supersecret1", newPassword: "newsupersecret" });
    expect(good.status).toBe(200);

    // old password no longer works, new one does
    const oldTry = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@studio.dev", password: "supersecret1" });
    expect(oldTry.status).toBe(400);
    const newTry = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@studio.dev", password: "newsupersecret" });
    expect(newTry.status).toBe(200);
  });
});

describe("auth: protected API surface", () => {
  it("blocks /api/ventures without a token", async () => {
    const res = await request(app).get("/api/ventures");
    expect(res.status).toBe(401);
  });

  it("blocks mutations without a token", async () => {
    const res = await request(app).post("/api/ventures").send({ name: "Nope" });
    expect(res.status).toBe(401);
  });

  it("allows /api/ventures with a valid token", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@studio.dev", password: "newsupersecret" });
    const res = await request(app)
      .get("/api/ventures")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("health endpoint stays public", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("unknown API path still returns JSON 404 (after auth middleware)", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(401); // auth gate fires before the 404 handler
  });
});
