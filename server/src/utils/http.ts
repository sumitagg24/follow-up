import { NextFunction, Request, RequestHandler, Response } from "express";

/** Error with a stable HTTP status; anything else falls back to 500. */
export class HttpError extends Error {
  status: number;
  details?: string[];
  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: string[]) => new HttpError(400, message, details);
export const notFound = (what = "Resource") => new HttpError(404, `${what} not found`);

/** Wrap async controllers so rejections hit the central error handler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Validate a route `id` param as a MongoDB ObjectId (24 hex chars). */
export function isValidObjectId(id: unknown): boolean {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}
