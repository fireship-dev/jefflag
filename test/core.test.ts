import { describe, it, expect } from "vitest";
import { JefflagDate, parseISO, format } from "../src/index.js";

describe("timezone + DST", () => {
  it("keeps the instant when changing zones", () => {
    const utc = parseISO("2026-03-08T12:00:00Z");
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
    const before = JefflagDate.fromParts(
      { year: 2026, month: 3, day: 7, hour: 12, minute: 0, second: 0, millisecond: 0 },
      "America/New_York",
    );
    const after = before.add({ days: 1 });
    expect(after.parts.hour).toBe(12);
    expect(after.parts.day).toBe(8);
  });
});

describe("format", () => {
  it("renders tokens and escapes brackets", () => {
    const d = parseISO("2026-12-25T09:05:00Z");
    expect(format(d, "dddd, MMMM DD YYYY [at] HH:mm")).toBe("Friday, December 25 2026 at 09:05");
  });
});
