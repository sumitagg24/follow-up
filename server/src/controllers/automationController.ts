import { Request, Response } from "express";
import { checkDueFollowUps } from "../services/automationService.js";
export async function runCheck(req: Request, res: Response) {
  const result = await checkDueFollowUps();
  res.json(result);
}
