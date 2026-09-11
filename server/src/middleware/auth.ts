import type { Request } from "express";
import jwt from "jsonwebtoken";
import { HttpError, isValidObjectId } from "../utils/http.js";
import { getJwtSecret } from "../utils/env.js";
import { User, type IUser } from "../models/User.js";

/** Sign a 7-day session token for a user id. */
export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: "7d" });
}

/** Express Request extended with the authenticated user (hash removed). */
export type AuthedRequest = Request & { userId?: string; user?: Omit<IUser, "passwordHash"> & { _id: unknown } };

/**
 * Require a valid Bearer token. On success attaches `req.userId` and `req.user`.
 * On failure the central error handler returns { error } with 401.
 */
export async function requireAuth(req: AuthedRequest, _res: unknown, next: (e?: unknown) => void) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new HttpError(401, "Authentication required");
    let payload: any;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch {
      throw new HttpError(401, "Session expired or invalid — please sign in again");
    }
    // A validly-signed token with a missing/malformed subject is still
    // unauthenticated — never let it fall through to a 400 CastError.
    if (!payload || typeof payload !== "object" || !isValidObjectId(payload.sub)) {
      throw new HttpError(401, "Session expired or invalid — please sign in again");
    }
    const user = await User.findById(payload.sub).lean();
    if (!user) throw new HttpError(401, "Account no longer exists");
    const { passwordHash: _hash, ...safe } = user as any;
    req.userId = (user._id as any).toString();
    req.user = safe;
    next();
  } catch (e) {
    next(e);
  }
}

/** Optional auth: attaches req.user when a valid token is present, never rejects. */
export async function optionalAuth(req: AuthedRequest, _res: unknown, next: (e?: unknown) => void) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token) {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as any;
      if (!payload || typeof payload !== "object" || !isValidObjectId(payload.sub)) return next();
      const user = await User.findById(payload.sub).lean();
      if (user) {
        const { passwordHash: _hash, ...safe } = user as any;
        req.userId = (user._id as any).toString();
        req.user = safe;
      }
    } catch {
      /* ignore invalid tokens for optional routes */
    }
  }
  next();
}
