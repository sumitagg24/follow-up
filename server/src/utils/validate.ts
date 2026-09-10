export const VENTURE_STATUSES = ["New", "Evaluation", "Review", "Active", "Closed"] as const;
export type VentureStatusValue = (typeof VENTURE_STATUSES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function isValidEmail(v: unknown): boolean {
  return isNonEmptyString(v) && EMAIL_RE.test(v.trim());
}

/** Accepts ISO `YYYY-MM-DD` (strict) or any string JS Date can parse; rejects non-dates. */
export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  if (!DATE_RE.test(value) && Number.isNaN(Date.parse(value))) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateVenturePayload(body: any, { partial = false } = {}): string[] {
  const errors: string[] = [];
  const check = (cond: boolean, msg: string) => {
    if (!cond) errors.push(msg);
  };

  if (!partial || body.name !== undefined) check(isNonEmptyString(body.name), "Venture name is required");
  if (!partial || body.founderName !== undefined)
    check(isNonEmptyString(body.founderName), "Founder name is required");
  if (!partial || body.founderEmail !== undefined)
    check(isValidEmail(body.founderEmail), "A valid founder email is required");
  if (!partial || body.industry !== undefined) check(isNonEmptyString(body.industry), "Industry is required");
  if (!partial || body.status !== undefined)
    check(
      (VENTURE_STATUSES as readonly string[]).includes(body.status),
      `Status must be one of: ${VENTURE_STATUSES.join(", ")}`
    );
  if (!partial || body.followUpDate !== undefined) {
    check(body.followUpDate !== undefined, "Follow-up date is required");
    if (body.followUpDate !== undefined) check(parseDate(body.followUpDate) !== null, "Follow-up date must be a valid date");
  }
  if (body.notes !== undefined) check(typeof body.notes === "string", "Notes must be a string");

  return errors;
}

export function validateTaskPayload(body: any): string[] {
  const errors: string[] = [];
  if (!isNonEmptyString(body.title)) errors.push("Task title is required");
  if (body.dueDate !== undefined && body.dueDate !== null && parseDate(body.dueDate) === null)
    errors.push("Task due date must be a valid date");
  if (body.status !== undefined && !["pending", "completed"].includes(body.status))
    errors.push("Task status must be pending or completed");
  return errors;
}

export function validateFollowUpPayload(body: any): string[] {
  const errors: string[] = [];
  if (!isNonEmptyString(body.ventureId) || !/^[0-9a-fA-F]{24}$/.test(body.ventureId.trim()))
    errors.push("ventureId must be a valid venture id");
  if (parseDate(body.dueDate) === null) errors.push("dueDate must be a valid date");
  return errors;
}
