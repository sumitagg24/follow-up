/** Tracks how the server booted so /api/system can report honest status. */
export const runtime = {
  dbMode: "unset" as "mongodb" | "in-memory" | "unset",
  startedAt: new Date(),
  cronScheduled: false,
};
