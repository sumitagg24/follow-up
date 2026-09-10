import cron from "node-cron";
import { checkDueFollowUps } from "../services/automationService.js";

export function startCron() {
  // Run every day at 9am
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Checking due follow-ups...");
    try {
      const res = await checkDueFollowUps();
      console.log("[CRON] Result:", res);
    } catch (e) {
      console.error("[CRON] Error", e);
    }
  });
  console.log("[CRON] Scheduled daily at 09:00");
}
