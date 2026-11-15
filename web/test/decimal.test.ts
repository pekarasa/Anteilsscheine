import { describe, expect, it } from "vitest";
import { multiplyTruncated, parseDecimal } from "../src/logic/decimal";

describe("parseDecimal", () => {
  it("keeps the original text and the exact scaled value", () => {
    expect(parseDecimal("0.8")).toEqual({ text: "0.8", units: 8n, scale: 1 });
    expect(parseDecimal("1.0")).toEqual({ text: "1.0", units: 10n, scale: 1 });
    expect(parseDecimal("2")).toEqual({ text: "2", units: 2n, scale: 0 });
  });

  it("parses negative values", () => {
    expect(parseDecimal("-0.5")).toEqual({ text: "-0.5", units: -5n, scale: 1 });
  });

  it("trims surrounding whitespace", () => {
    expect(parseDecimal(" 0.9 ").text).toBe("0.9");
  });

  it("rejects values that are not plain decimal numbers", () => {
    expect(() => parseDecimal("0,8")).toThrow("0,8");
    expect(() => parseDecimal("abc")).toThrow();
    expect(() => parseDecimal("")).toThrow();
  });
});

describe("multiplyTruncated", () => {
  it("avoids floating point errors", () => {
    expect(multiplyTruncated(100, parseDecimal("0.29"))).toBe(29);
  });

  it("truncates instead of rounding", () => {
    expect(multiplyTruncated(600, parseDecimal("0.8"))).toBe(480);
    expect(multiplyTruncated(1, parseDecimal("0.8"))).toBe(0);
    expect(multiplyTruncated(650, parseDecimal("0.9"))).toBe(585);
  });

  it("truncates towards zero for negative values", () => {
    expect(multiplyTruncated(-5, parseDecimal("0.5"))).toBe(-2);
    expect(multiplyTruncated(-5, parseDecimal("1.0"))).toBe(-5);
  });
});
