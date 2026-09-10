import { Request, Response } from "express";
import { checkDueFollowUps } from "../services/automationService.js";
import { asyncHandler } from "../utils/http.js";

export const runCheck = asyncHandler(async (req: Request, res: Response) => {
  const result = await checkDueFollowUps("manual");
  res.json(result);
});
