export { SundialDate } from "./core.js";
export type { Parts, Duration, Zone } from "./core.js";
export { zoneOffset, wallToEpoch } from "./core.js";
export { parseISO } from "./parse.js";
export { format } from "./format.js";

import { SundialDate, type Zone } from "./core.js";
import { parseISO } from "./parse.js";

/** Convenience entry point: `sundial()` = now, `sundial(isoString)` = parsed. */
export function sundial(input?: string, zone: Zone = "UTC"): SundialDate {
  return input === undefined ? SundialDate.now(zone) : parseISO(input, zone);
}
