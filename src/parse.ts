import { JefflagDate, type Parts, type Zone } from "./core.js";

const ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Parse an ISO-8601 string. If the string carries an offset it is honoured and
 * the result is expressed in `zone` (default UTC). Naive strings are interpreted
 * as wall time in `zone`.
 */
export function parseISO(input: string, zone: Zone = "UTC"): JefflagDate {
  // Normalize date-only strings with offset (e.g. "2024-07-03+05:30")
  // to include the implicit time component so the main regex matches.
  const normalized = input.trim().replace(
    /^(\d{4}-\d{2}-\d{2})([+-]\d{2}:\d{2})$/,
    "$1T00:00:00$2",
  );
  const m = ISO.exec(normalized);
  if (!m) throw new RangeError(`Unrecognised ISO date: ${JSON.stringify(input)}`);
  const [, y, mo, d, h = "0", mi = "0", s = "0", ms = "0", off] = m;
  const parts: Parts = {
    year: +y,
    month: +mo,
    day: +d,
    hour: +h,
    minute: +mi,
    second: +s,
    millisecond: +ms.padEnd(3, "0"),
  };
  if (!off) return JefflagDate.fromParts(parts, zone);

  const offsetMin = off === "Z" ? 0 : offsetToMinutes(off);
  const utc =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond) -
    offsetMin * 60_000;
  return JefflagDate.fromEpoch(utc, zone);
}

function offsetToMinutes(off: string): number {
  const sign = off[0] === "-" ? -1 : 1;
  const clean = off.slice(1).replace(":", "");
  return sign * (Number(clean.slice(0, 2)) * 60 + Number(clean.slice(2)));
}
