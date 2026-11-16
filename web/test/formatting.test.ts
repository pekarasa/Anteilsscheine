import { describe, expect, it } from "vitest";
import { formatAmount, formatLongGermanDate, formatPrintDate } from "../src/template/formatting";

describe("formatAmount", () => {
  it("groups thousands with the de-CH separator", () => {
    expect(formatAmount(5)).toBe("5");
    expect(formatAmount(1000)).toBe("1\u2019000");
    expect(formatAmount(1234567)).toBe("1\u2019234\u2019567");
  });

  it("formats negative amounts with a leading minus", () => {
    expect(formatAmount(-5000)).toBe("-5\u2019000");
    expect(formatAmount(-200)).toBe("-200");
  });

  it("returns an empty string for zero, like .NET format \"##,#\"", () => {
    expect(formatAmount(0)).toBe("");
  });
});

describe("formatLongGermanDate", () => {
  it("writes the month name and does not pad the day", () => {
    expect(formatLongGermanDate({ year: 2026, month: 2, day: 28 })).toBe("28. Februar 2026");
    expect(formatLongGermanDate({ year: 2026, month: 3, day: 5 })).toBe("5. März 2026");
  });
});

describe("formatPrintDate", () => {
  it("turns the ISO date of Settings.json into a German date", () => {
    expect(formatPrintDate("2026-02-28")).toBe("28. Februar 2026");
  });

  it("rejects invalid dates", () => {
    expect(() => formatPrintDate("2026-02-30")).toThrow();
  });
});
