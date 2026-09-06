import { JefflagDate, type Zone } from "./core.js";

/**
 * True if both instants fall on the same wall-clock date.
 *
 * By default each date is read in its own zone; pass `zone` to compare both on
 * a common wall clock (e.g. "is this on the same calendar day for the user?").
 */
export function isSameDay(a: JefflagDate, b: JefflagDate, zone?: Zone): boolean {
  const pa = (zone ? a.withZone(zone) : a).parts;
  const pb = (zone ? b.withZone(zone) : b).parts;
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/** True if both instants fall in the same wall-clock month. */
export function isSameMonth(a: JefflagDate, b: JefflagDate, zone?: Zone): boolean {
  const pa = (zone ? a.withZone(zone) : a).parts;
  const pb = (zone ? b.withZone(zone) : b).parts;
  return pa.year === pb.year && pa.month === pb.month;
}

/**
 * True if `date`'s wall-clock date is today in its zone.
 * `now` is injectable for tests.
 */
export function isToday(date: JefflagDate, now: number = Date.now()): boolean {
  return isSameDay(date, JefflagDate.fromEpoch(now, date.zone));
}
