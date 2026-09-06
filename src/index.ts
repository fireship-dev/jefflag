export { JefflagDate, zoneOffset, wallToEpoch } from "./core.js";
export type { Parts, Duration, Zone, DiffUnit } from "./core.js";
export { parseISO } from "./parse.js";
export { format } from "./format.js";

import { JefflagDate } from "./core.js";
import type { Zone } from "./core.js";
import { parseISO } from "./parse.js";

/**
 * Convenience entry point: `jefflag()` is now, `jefflag(isoString)` is parsed.
 *
 * @param input - Optional ISO-8601 string.
 * @param zone - IANA zone id (default `"UTC"`).
 */
export function jefflag(input?: string, zone: Zone = "UTC"): JefflagDate {
  return input === undefined ? JefflagDate.now(zone) : parseISO(input, zone);
}
