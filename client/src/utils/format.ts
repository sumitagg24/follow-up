export function fmtDate(d: string|Date) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { year:"numeric", month:"short", day:"numeric" });
}
export function fmtDateInput(d: string|Date) {
  const date = new Date(d);
  return date.toISOString().slice(0,10);
}
