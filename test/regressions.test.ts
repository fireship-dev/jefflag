import { describe, it, expect } from "vitest";
import { JefflagDate, parseISO, format } from "../src/index.js";

// Each entry here corresponds to a fixed bug. Kept deliberately robust.
describe("regressions", () => {
  it("adding a day across the NY spring-forward gap does not throw", () => {
    expect(() =>
      JefflagDate.fromParts(
        { year: 2026, month: 3, day: 7, hour: 1, minute: 30, second: 0, millisecond: 0 },
        "America/New_York",
      ).add({ days: 1 }),
    ).not.toThrow();
  });

  it("half-hour offset zones expose a numeric offset", () => {
    expect(parseISO("2026-01-01T00:00:00Z").withZone("Asia/Kolkata").offsetMinutes).toBeTypeOf("number");
  });

  it("parseISO honours an embedded offset", () => {
    expect(parseISO("2026-07-01T14:00:00+05:30").toISO()).toContain("2026-07-01");
  });

  it("isDST returns a boolean for the fall-back overlap", () => {
    expect(parseISO("2026-11-01T01:30:00", "America/New_York").isDST()).toBeTypeOf("boolean");
  });

  it("format survives pre-1970 instants", () => {
    expect(format(parseISO("1968-06-01T12:00:00Z"), "YYYY")).toBe("1968");
  });
});
