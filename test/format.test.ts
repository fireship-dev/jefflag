import { describe, it, expect } from "vitest";
import { parseISO, format } from "../src/index.js";

describe("format tokens", () => {
  const d = parseISO("2026-06-15T13:45:00Z");

  it("renders date and 24h time", () => {
    expect(format(d, "YYYY-MM-DD HH:mm")).toBe("2026-06-15 13:45");
  });

  it("renders 12h time with meridiem", () => {
    expect(format(d, "hh:mm A")).toBe("01:45 PM");
  });

  it("escapes bracketed literals", () => {
    expect(format(parseISO("2026-06-15T00:00:00Z"), "[year] YYYY")).toBe("year 2026");
  });
});
