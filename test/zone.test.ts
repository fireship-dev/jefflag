import { describe, it, expect, beforeEach } from "vitest";
import { zoneOffset, clearZoneCache, zoneCacheStats, parseISO } from "../src/index.js";

describe("offset cache", () => {
  beforeEach(() => clearZoneCache());

  it("returns the same offset as the uncached formatter on both sides of a transition", () => {
    // US spring-forward 2026-03-08 07:00 UTC (02:00 EST -> 03:00 EDT).
    const before = Date.UTC(2026, 2, 8, 6, 59, 59, 999);
    const after = Date.UTC(2026, 2, 8, 7, 0, 0, 0);
    expect(zoneOffset(before, "America/New_York")).toBe(-300);
    expect(zoneOffset(after, "America/New_York")).toBe(-240);
    // Second lookup should hit the cache and agree.
    expect(zoneOffset(before, "America/New_York")).toBe(-300);
    expect(zoneOffset(after, "America/New_York")).toBe(-240);
  });

  it("handles zones whose transitions fall on a half-hour UTC boundary", () => {
    // Lord Howe Island switches at 02:00 local (+10:30) = 15:30 UTC the day before.
    const before = Date.UTC(2026, 9, 3, 15, 29);
    const after = Date.UTC(2026, 9, 3, 15, 30);
    expect(zoneOffset(before, "Australia/Lord_Howe")).toBe(630);
    expect(zoneOffset(after, "Australia/Lord_Howe")).toBe(660);
  });

  it("keeps wall-clock parts stable through the cache", () => {
    const a = parseISO("2026-11-01T05:30:00Z").withZone("America/New_York");
    const b = parseISO("2026-11-01T05:30:00Z").withZone("America/New_York");
    expect(a.parts).toEqual(b.parts);
    expect(a.offsetMinutes).toBe(b.offsetMinutes);
  });

  it("normalises negative epoch milliseconds", () => {
    expect(parseISO("1969-12-31T23:59:59.500Z").parts.millisecond).toBe(500);
  });
});

describe("zoneCacheStats", () => {
  beforeEach(() => clearZoneCache());

  it("counts hits and misses", () => {
    const t = Date.UTC(2026, 5, 1, 12);
    zoneOffset(t, "Europe/Berlin");
    zoneOffset(t, "Europe/Berlin");
    zoneOffset(t + 60_000, "Europe/Berlin"); // same 15-minute bucket
    expect(zoneCacheStats()).toMatchObject({ hits: 2, misses: 1, offsets: 1, formatters: 1 });
  });

  it("resets with clearZoneCache", () => {
    zoneOffset(0, "UTC");
    clearZoneCache();
    expect(zoneCacheStats()).toEqual({ hits: 0, misses: 0, evictions: 0, offsets: 0, formatters: 0 });
  });
});
