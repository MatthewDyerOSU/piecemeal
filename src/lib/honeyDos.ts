import type { HoneyDo, HoneyDoCadence } from "@/types/honeyDo";

export const HONEY_DO_CADENCES: HoneyDoCadence[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
];

export const CADENCE_LABELS: Record<HoneyDoCadence, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * Start of the current recurrence period, in UTC. A recurring item
 * checked before this instant is considered stale and resets:
 * - daily: today at 00:00 UTC
 * - weekly: the most recent Monday at 00:00 UTC
 * - monthly: the 1st of the month at 00:00 UTC
 *
 * UTC keeps the boundary predictable without storing a per-household
 * timezone; the reset lands at UTC midnight (evening in the Americas).
 */
export function periodStart(
  cadence: HoneyDoCadence,
  now: Date = new Date()
): Date | null {
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  if (cadence === "daily") {
    return midnight;
  }
  if (cadence === "weekly") {
    const daysSinceMonday = (midnight.getUTCDay() + 6) % 7;
    midnight.setUTCDate(midnight.getUTCDate() - daysSinceMonday);
    return midnight;
  }
  if (cadence === "monthly") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return null;
}

/** True when a recurring item was checked in an earlier period and should
    now flip back to unchecked. */
export function isDueForReset(item: HoneyDo, now: Date = new Date()): boolean {
  if (!item.checked || item.cadence === "none") {
    return false;
  }
  const start = periodStart(item.cadence, now);
  if (!start) {
    return false;
  }
  if (!item.checked_at) {
    return true;
  }
  return new Date(item.checked_at) < start;
}
