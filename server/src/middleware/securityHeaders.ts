import type { Request, Response, NextFunction } from "express";

/**
 * Minimal baseline security headers for a JSON API (no new dependencies).
 * Deliberately no Content-Security-Policy: the server only serves JSON, and
 * an unnecessary CSP risks conflicting with the separately-deployed SPA.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  next();
}
