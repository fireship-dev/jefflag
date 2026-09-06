import { JefflagDate, type Zone } from "./core.js";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Format with a small token grammar:
 *   YYYY YY  MM MMM MMMM  DD ddd dddd  HH mm ss  A a  Z
 * Tokens can be escaped with square brackets, e.g. "[on] MMMM DD".
 */
export function format(date: JefflagDate, pattern: string): string {
  const p = date.parts;
  // Weekday must be derived from the *wall-clock* date, not the epoch: in zones
  // east of UTC an instant near midnight belongs to a different UTC day than the
  // one Intl reports for its wall clock, so getUTCDay() on the epoch returns the
  // wrong day-of-week.
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;

  const tokens: Record<string, string> = {
    YYYY: pad(p.year, 4),
    YY: pad(p.year % 100),
    MMMM: MONTHS[p.month - 1],
    MMM: MONTHS[p.month - 1].slice(0, 3),
    MM: pad(p.month),
    dddd: DAYS[dow],
    ddd: DAYS[dow].slice(0, 3),
    DD: pad(p.day),
    HH: pad(p.hour),
    hh: pad(h12),
    mm: pad(p.minute),
    ss: pad(p.second),
    A: p.hour < 12 ? "AM" : "PM",
    a: p.hour < 12 ? "am" : "pm",
    Z: offsetLabel(date.offsetMinutes),
  };

  return pattern.replace(/\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|dddd|ddd|DD|HH|hh|mm|ss|A|a|Z/g, (m, esc) =>
    esc !== undefined ? esc : tokens[m],
  );
}

function offsetLabel(min: number): string {
  if (min === 0) return "Z";
  const sign = min > 0 ? "+" : "-";
  return `${sign}${pad(Math.floor(Math.abs(min) / 60))}:${pad(Math.abs(min) % 60)}`;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/**
 * Format `date` as it would read on a wall clock in `zone`, without changing the
 * instant. Equivalent to `format(date.withZone(zone), pattern)` but avoids
 * allocating an intermediate JefflagDate and reuses the cached formatter for
 * `zone`, which matters when rendering the same instant in many zones (world
 * clocks, meeting schedulers).
 */
export function formatInZone(date: JefflagDate, pattern: string, zone: Zone): string {
  if (zone === date.zone) return format(date, pattern);
  return format(date.withZone(zone), pattern);
}
