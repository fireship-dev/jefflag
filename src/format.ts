import type { JefflagDate } from "./core.js";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const TOKEN_RE = /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|dddd|ddd|DD|HH|hh|mm|ss|A|a|Z/g;

/**
 * Format a date with a small token grammar.
 *
 * Supported tokens: `YYYY YY MM MMM MMMM DD ddd dddd HH hh mm ss A a Z`.
 * Anything inside square brackets is emitted literally, e.g. `"[on] MMMM DD"`.
 *
 * @param date - Instant to render, in its own zone.
 * @param pattern - Token pattern.
 * @returns The rendered string.
 */
export function format(date: JefflagDate, pattern: string): string {
  const p = date.parts;
  // Weekday must be derived from the *wall-clock* date, not the epoch: in zones
  // east of UTC an instant near midnight belongs to a different UTC day than the
  // one Intl reports for its wall clock, so getUTCDay() on the epoch returns the
  // wrong day-of-week.
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const month = MONTHS[p.month - 1] ?? "";
  const day = DAYS[dow] ?? "";

  const tokens: Record<string, string> = {
    YYYY: pad(p.year, 4),
    YY: pad(p.year % 100),
    MMMM: month,
    MMM: month.slice(0, 3),
    MM: pad(p.month),
    dddd: day,
    ddd: day.slice(0, 3),
    DD: pad(p.day),
    HH: pad(p.hour),
    hh: pad(h12),
    mm: pad(p.minute),
    ss: pad(p.second),
    A: p.hour < 12 ? "AM" : "PM",
    a: p.hour < 12 ? "am" : "pm",
    Z: offsetLabel(date.offsetMinutes),
  };

  return pattern.replace(TOKEN_RE, (m: string, esc: string | undefined) =>
    esc !== undefined ? esc : (tokens[m] ?? m),
  );
}

/** Render an offset in minutes as `Z` or `±HH:mm`. */
function offsetLabel(min: number): string {
  if (min === 0) return "Z";
  const sign = min > 0 ? "+" : "-";
  return `${sign}${pad(Math.floor(Math.abs(min) / 60))}:${pad(Math.abs(min) % 60)}`;
}

/** Left-pad a number with zeros. */
function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}
