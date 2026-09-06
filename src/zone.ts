// Zone resolution: the single place that talks to Intl.
//
// Constructing an Intl.DateTimeFormat is by far the most expensive thing this
// library does (it loads and parses the zone's transition table), and the
// resolved offset for a given zone only changes at DST transitions. Both are
// therefore cached here so that the rest of the library can call
// `zoneOffset()` freely without re-paying the Intl cost on every arithmetic op.

import type { Parts, Zone } from "./core.js";

/** Minutes in a UTC "bucket" that shares a single cached offset. */
const OFFSET_BUCKET_MS = 15 * 60_000;
/** Soft cap on cached offset buckets before the cache is reset. */
const OFFSET_CACHE_LIMIT = 4096;

const formatters = new Map<Zone, Intl.DateTimeFormat>();
const offsets = new Map<string, number>();

/** Return the (cached) formatter used to resolve wall-clock parts in `zone`. */
export function formatterFor(zone: Zone): Intl.DateTimeFormat {
  let dtf = formatters.get(zone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(zone, dtf);
  }
  return dtf;
}

/** Wall-clock parts of an instant in `zone`. */
export function wallParts(epochMs: number, zone: Zone): Parts {
  const map: Record<string, number> = {};
  for (const p of formatterFor(zone).formatToParts(new Date(epochMs))) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour === 24 ? 0 : map.hour,
    minute: map.minute,
    second: map.second,
    millisecond: ((epochMs % 1000) + 1000) % 1000,
  };
}

/** Uncached offset (minutes) of `zone` at `epochMs`, derived from the formatted wall time. */
function computeOffset(epochMs: number, zone: Zone): number {
  const p = wallParts(epochMs, zone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.millisecond);
  return Math.round((asUTC - epochMs) / 60_000);
}

/**
 * Offset (minutes) of `zone` at a given instant.
 *
 * Offsets are cached per zone per 15-minute UTC bucket. Every real-world DST
 * transition happens on a 15-minute UTC boundary, so an instant never shares a
 * bucket with a different offset than the one computed at the bucket start.
 */
export function zoneOffset(epochMs: number, zone: Zone): number {
  const bucket = Math.floor(epochMs / OFFSET_BUCKET_MS);
  const key = `${zone}|${bucket}`;
  const hit = offsets.get(key);
  if (hit !== undefined) return hit;

  if (offsets.size >= OFFSET_CACHE_LIMIT) offsets.clear();
  const value = computeOffset(bucket * OFFSET_BUCKET_MS, zone);
  offsets.set(key, value);
  return value;
}

/** Drop every cached formatter and offset. Mostly useful in tests. */
export function clearZoneCache(): void {
  formatters.clear();
  offsets.clear();
}
