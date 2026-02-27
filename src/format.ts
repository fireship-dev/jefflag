import { SundialDate } from "./core.js";

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
export function format(date: SundialDate, pattern: string): string {
  const p = date.parts;
  const dow = new Date(date.epochMs).getUTCDay(); // weekday is offset-invariant here
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
