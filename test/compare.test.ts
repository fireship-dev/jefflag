import { describe, it, expect } from "vitest";
import { parseISO, isSameDay, isSameMonth, isToday } from "../src/index.js";

describe("isSameDay", () => {
  it("compares wall-clock dates in each instant's own zone", () => {
    const a = parseISO("2026-06-15T23:30:00Z");
    const b = parseISO("2026-06-15T22:00:00Z");
    expect(isSameDay(a, b)).toBe(true);
    // Same instants read in Tokyo are already the 16th.
    expect(isSameDay(a.withZone("Asia/Tokyo"), b)).toBe(false);
  });

  it("uses a common zone when one is given", () => {
    const a = parseISO("2026-06-15T23:30:00Z");
    const b = parseISO("2026-06-16T01:00:00Z");
    expect(isSameDay(a, b)).toBe(false);
    expect(isSameDay(a, b, "America/New_York")).toBe(true);
  });
});

describe("isSameMonth / isToday", () => {
  it("isSameMonth ignores the day", () => {
    expect(isSameMonth(parseISO("2026-02-01T00:00:00Z"), parseISO("2026-02-28T23:59:59Z"))).toBe(true);
    expect(isSameMonth(parseISO("2026-02-28T23:59:59Z"), parseISO("2026-03-01T00:00:00Z"))).toBe(false);
  });

  it("isToday accepts an injected clock", () => {
    const d = parseISO("2026-09-06T10:00:00", "Australia/Sydney");
    expect(isToday(d, Date.UTC(2026, 8, 6, 12))).toBe(true);
    expect(isToday(d, Date.UTC(2026, 8, 7, 12))).toBe(false);
  });
});
