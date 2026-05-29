// Shared duration → date-range helper (single source of truth).
// Extracted from MISAnalyticsPage so every chart/table/report resolves windows
// identically. End is padded forward to cover the forward-anchored seed window
// (latest seeded data sits ~7 days ahead of "now").

const DAY_MS = 24 * 60 * 60 * 1000;

// Duration label → lookback window in days.
export const DURATION_DAYS = {
  'Live Data': 2,
  'Last Day': 2,
  'Daily': 2,
  'Last Week': 8,
  'Weekly': 8,
  'Last Month': 31,
  'Last One Month': 31,
  'Monthly': 31,
  'Last Three Months': 92,
};

// Returns { from, to } as ISO strings for a duration label.
// `endPadDays` forward-pads the end so future-anchored seed data is included.
export function durationToRange(duration, { endPadDays = 8 } = {}) {
  const days = DURATION_DAYS[duration] ?? 31;
  const now = Date.now();
  return {
    from: new Date(now - days * DAY_MS).toISOString(),
    to: new Date(now + endPadDays * DAY_MS).toISOString(),
  };
}
