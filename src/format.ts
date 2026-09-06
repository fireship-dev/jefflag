import { JefflagDate, type Parts } from "./core.js";

/** A user-defined token: either a function or a JS expression string over `p` (Parts) and `date`. */
export type TokenResolver = string | ((p: Parts, date: JefflagDate) => string | number);

const customTokens = new Map<string, (p: Parts, date: JefflagDate) => string | number>();

/**
 * Register a custom format token.
 *
 * `resolver` can be a function, or - handy when tokens come from a config file
 * or a CMS - a JavaScript expression string evaluated with `p` (the wall-clock
 * `Parts`) and `date` in scope:
 *
 *   registerToken("Q", "Math.ceil(p.month / 3)");         // quarter
 *   registerToken("DOY", (p) => dayOfYear(p));            // function form
 *   format(d, "YYYY [Q]Q")                                // "2026 Q3"
 *
 * Custom tokens are matched before the built-in ones, so a custom `MM` wins.
 */
export function registerToken(name: string, resolver: TokenResolver): void {
  if (!/^[A-Za-z]+$/.test(name)) throw new RangeError(`Token names must be letters only: ${name}`);
  const fn =
    typeof resolver === "function"
      ? resolver
      : (new Function("p", "date", `return (${resolver});`) as (p: Parts, date: JefflagDate) => string | number);
  customTokens.set(name, fn);
  rebuildTokenRegex();
}

/** Remove a custom token (no-op if it was never registered). */
export function unregisterToken(name: string): void {
  customTokens.delete(name);
  rebuildTokenRegex();
}

const BUILTIN = "YYYY|YY|MMMM|MMM|MM|dddd|ddd|DD|HH|hh|mm|ss|A|a|Z";
let tokenRegex = new RegExp(`\\[([^\\]]*)\\]|${BUILTIN}`, "g");

function rebuildTokenRegex(): void {
  // Longest names first so "QQ" beats "Q".
  const custom = [...customTokens.keys()].sort((a, b) => b.length - a.length).join("|");
  tokenRegex = new RegExp(`\\[([^\\]]*)\\]|${custom ? custom + "|" : ""}${BUILTIN}`, "g");
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Format with a small token grammar:
 *   YYYY YY  MM MMM MMMM  DD ddd dddd  HH mm ss  A a  Z
 * Tokens can be escaped with square brackets, e.g. "[on] MMMM DD".
 * Additional tokens can be added with `registerToken()`.
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

  return pattern.replace(tokenRegex, (m, esc) => {
    if (esc !== undefined) return esc;
    const custom = customTokens.get(m);
    return custom ? String(custom(p, date)) : tokens[m];
  });
}

function offsetLabel(min: number): string {
  if (min === 0) return "Z";
  const sign = min > 0 ? "+" : "-";
  return `${sign}${pad(Math.floor(Math.abs(min) / 60))}:${pad(Math.abs(min) % 60)}`;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}
