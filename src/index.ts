export { JefflagDate } from "./core.js";
export type { Parts, Duration, Zone } from "./core.js";
export { zoneOffset, wallToEpoch } from "./core.js";
export { parseISO } from "./parse.js";
export { format } from "./format.js";

import { JefflagDate, type Zone } from "./core.js";
import { parseISO } from "./parse.js";

/** Convenience entry point: `jefflag()` = now, `jefflag(isoString)` = parsed. */
export function jefflag(input?: string, zone: Zone = "UTC"): JefflagDate {
  return input === undefined ? JefflagDate.now(zone) : parseISO(input, zone);
}
