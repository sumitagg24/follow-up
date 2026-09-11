import { Router } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler, badRequest } from "../utils/http.js";
import { User } from "../models/User.js";
import { requireAuth, signToken, type AuthedRequest } from "../middleware/auth.js";

const r = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email: unknown, password: unknown, name?: unknown) {
  const details: string[] = [];
  const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!emailStr) details.push("Email is required");
  else if (!EMAIL_RE.test(emailStr)) details.push("Email is not a valid address");
  const passStr = typeof password === "string" ? password : "";
  if (!passStr) details.push("Password is required");
  else if (passStr.length < 8) details.push("Password must be at least 8 characters");
  if (name !== undefined) {
    const nameStr = typeof name === "string" ? name.trim() : "";
    if (!nameStr) details.push("Name is required");
    else if (nameStr.length > 80) details.push("Name must be 80 characters or fewer");
  }
  return { emailStr, passStr, details };
}

/** POST /api/auth/register — create an account { name, email, password } */
r.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};
    const { emailStr, passStr, details } = validateCredentials(email, password, name);
    if (details.length) throw badRequest("Validation failed", details);

    const existing = await User.findOne({ email: emailStr }).lean();
    if (existing) throw badRequest("An account with this email already exists");

    let user;
    try {
      user = await User.create({ name: String(name).trim(), email: emailStr, password: passStr } as any);
    } catch (e: any) {
      // Concurrent registrations can both pass the check above — the unique
      // index is the final arbiter; translate it into the same 400.
      if (e?.code === 11000) throw badRequest("An account with this email already exists");
      throw e;
    }
    const token = signToken((user._id as any).toString());
    res.status(201).json({ token, user: user.toJSON() });
  })
);

/** POST /api/auth/login — sign in { email, password } → { token, user } */
r.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    const { emailStr, passStr, details } = validateCredentials(email, password);
    if (details.length) throw badRequest("Validation failed", details);

    const user = await User.findOne({ email: emailStr });
    // Same generic message for unknown email and wrong password — no account enumeration.
    const ok = user ? await user.verifyPassword(passStr) : false;
    if (!user || !ok) throw badRequest("Invalid email or password", undefined);

    const token = signToken((user._id as any).toString());
    res.json({ token, user: user.toJSON() });
  })
);

/** GET /api/auth/me — current user (Bearer token) */
r.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

/** PUT /api/auth/password — change password { currentPassword, newPassword } (Bearer token) */
r.put(
  "/password",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || !currentPassword)
      throw badRequest("Current password is required");
    if (typeof newPassword !== "string" || newPassword.length < 8)
      throw badRequest("New password must be at least 8 characters");

    const user = await User.findById(req.userId);
    if (!user) throw badRequest("Account not found");
    const ok = await user.verifyPassword(currentPassword);
    if (!ok) throw badRequest("Current password is incorrect");

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  })
);

export default r;
