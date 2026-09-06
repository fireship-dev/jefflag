import { describe, it, expect } from "vitest";
import { JefflagDate, parseISO, format } from "../src/index.js";
import type { Parts } from "../src/index.js";

const noon = (year: number, month: number, day: number): Parts => ({
  year,
  month,
  day,
  hour: 12,
  minute: 0,
  second: 0,
  millisecond: 0,
});

describe("timezone + DST", () => {
  it("keeps the instant when changing zones", () => {
    const utc = parseISO("2026-01-15T12:00:00Z");
    const ny = utc.withZone("America/New_York");
    expect(ny.epochMs).toBe(utc.epochMs);
    expect(ny.parts.hour).toBe(7); // EST, UTC-5
  });

  it("detects daylight saving", () => {
    expect(parseISO("2026-07-01T12:00:00Z").withZone("America/New_York").isDST()).toBe(true);
    expect(parseISO("2026-01-01T12:00:00Z").withZone("America/New_York").isDST()).toBe(false);
  });

  it("adds a day across the spring-forward transition", () => {
    // 2026-03-08 02:00 is the US DST gap. Adding a day should land on the same wall hour.
    const before = JefflagDate.fromParts(noon(2026, 3, 7), "America/New_York");
    const after = before.add({ days: 1 });
    expect(after.parts.hour).toBe(12);
    expect(after.parts.day).toBe(8);
  });
});

describe("diff", () => {
  it("defaults to milliseconds and accepts an explicit unit", () => {
    const a = parseISO("2026-01-02T00:00:00Z");
    const b = parseISO("2026-01-01T00:00:00Z");
    expect(a.diff(b)).toBe(86_400_000);
    expect(a.diff(b, "hour")).toBe(24);
    expect(b.diff(a, "day")).toBe(-1);
  });
});

describe("format", () => {
  it("renders tokens and escapes brackets", () => {
    const d = parseISO("2026-12-25T09:05:00Z");
    expect(format(d, "dddd, MMMM DD YYYY [at] HH:mm")).toBe("Friday, December 25 2026 at 09:05");
  });
});
