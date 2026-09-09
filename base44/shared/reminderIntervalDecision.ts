// ── The ONE rule for "what kind of reminder is this?" ──────────────────────
//
// This is the single decision that had drifted into three different copies
// (in-app pipeline, native capture, calendar sync) and produced the cat-litter
// bug: a dateless capture became a 'once' task, and cronSmartTaskNudge skips
// 'once' tasks, so it was never nudged.
//
// Deliberately narrow: it decides ONLY the interval. It does NOT build records,
// pick dates, or schedule pushes — each caller keeps its own enrichment
// (calendar sync in particular needs event notes, locations, multi-day spans,
// birthday routing and recurrence advancement, none of which belong here).

const RECURRING = [
  "10min",
  "20min",
  "30min",
  "1hour",
  "2hours",
  "4hours",
  "daily",
  "every_other_day",
];

export const INTERVAL_MS: Record<string, number> = {
  "10min": 10 * 60 * 1000,
  "20min": 20 * 60 * 1000,
  "30min": 30 * 60 * 1000,
  "1hour": 60 * 60 * 1000,
  "2hours": 2 * 60 * 60 * 1000,
  "4hours": 4 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  every_other_day: 2 * 24 * 60 * 60 * 1000,
};

export function isRecurringInterval(interval: unknown): boolean {
  return typeof interval === "string" && RECURRING.includes(interval);
}

/**
 * Decides the reminder_interval for a newly created task.
 *
 * - Anchored to a specific date  → 'once' (its own precise reminder ladder)
 * - Explicit rhythm from the user → that recurring interval
 * - Neither                       → null, which is what marks a task a SMART
 *                                   REMINDER and lets cronSmartTaskNudge pick
 *                                   it up.
 *
 * @param parsed     the parser output (uses target_date + reminder_interval)
 * @param hasDateOverride  callers that KNOW the item is date-anchored
 *   regardless of what the parser echoed back pass `true`. Calendar sync does
 *   this: every Google item has a real start date, so it must never fall into
 *   the dateless smart-reminder branch.
 */
export function decideReminderInterval(
  parsed: any,
  hasDateOverride?: boolean,
): string | null {
  const hasDate = hasDateOverride === true || !!parsed?.target_date;
  if (hasDate) return "once";
  const interval = parsed?.reminder_interval;
  return isRecurringInterval(interval) ? interval : null;
}