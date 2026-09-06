import { describe, it, expect } from "vitest";
import { parseISO, format, registerToken, unregisterToken } from "../src/index.js";

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

describe("custom tokens", () => {
  const d = parseISO("2026-08-20T13:45:00Z");

  it("accepts an expression string", () => {
    registerToken("Q", "Math.ceil(p.month / 3)");
    expect(format(d, "YYYY [Q]Q")).toBe("2026 Q3");
    unregisterToken("Q");
  });

  it("accepts a function and can read the date", () => {
    registerToken("OFF", (_p, date) => date.offsetMinutes);
    expect(format(d.withZone("Asia/Kolkata"), "OFF")).toBe("330");
    unregisterToken("OFF");
  });

  it("prefers longer custom names and falls back to built-ins after unregister", () => {
    registerToken("DD", "p.day * 100");
    expect(format(d, "DD")).toBe("2000");
    unregisterToken("DD");
    expect(format(d, "DD")).toBe("20");
  });
});
