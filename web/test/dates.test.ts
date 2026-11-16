import { describe, expect, it } from "vitest";
import {
  calendarDateOf,
  formatGermanDate,
  formatIsoDate,
  parseDateInput,
  parseGermanDate,
  parseIsoDate,
} from "../src/io/dates";

describe("parseDateInput", () => {
  it("accepts one-digit day and month", () => {
    expect(parseDateInput("9.12.11")).toEqual({ year: 2011, month: 12, day: 9 });
  });

  it("accepts two-digit and four-digit years", () => {
    expect(parseDateInput("31.12.26")).toEqual({ year: 2026, month: 12, day: 31 });
    expect(parseDateInput("31.12.2026")).toEqual({ year: 2026, month: 12, day: 31 });
  });

  it("rejects dates that do not exist and other formats", () => {
    expect(parseDateInput("31.02.2026")).toBeUndefined();
    expect(parseDateInput("2026-12-31")).toBeUndefined();
    expect(parseDateInput("31122026")).toBeUndefined();
  });
});

describe("parseGermanDate", () => {
  it("reads two-digit years as 20xx", () => {
    expect(parseGermanDate("31.12.12")).toEqual({ year: 2012, month: 12, day: 31 });
  });

  it("reads four-digit years", () => {
    expect(parseGermanDate("09.12.2011")).toEqual({ year: 2011, month: 12, day: 9 });
  });

  it("ignores surrounding whitespace", () => {
    expect(parseGermanDate(" 01.02.15 ")).toEqual({ year: 2015, month: 2, day: 1 });
  });

  it("rejects other formats", () => {
    expect(parseGermanDate("2012-12-31")).toBeUndefined();
    expect(parseGermanDate("1.2.2012")).toBeUndefined();
    expect(parseGermanDate("")).toBeUndefined();
  });

  it("rejects dates that do not exist", () => {
    expect(parseGermanDate("31.02.2012")).toBeUndefined();
    expect(parseGermanDate("00.01.2012")).toBeUndefined();
    expect(parseGermanDate("01.13.2012")).toBeUndefined();
  });

  it("accepts 29 February only in leap years", () => {
    expect(parseGermanDate("29.02.2024")).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseGermanDate("29.02.2023")).toBeUndefined();
  });
});

describe("parseIsoDate", () => {
  it("reads yyyy-MM-dd", () => {
    expect(parseIsoDate("2026-02-28")).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it("rejects invalid dates", () => {
    expect(parseIsoDate("2026-02-30")).toBeUndefined();
    expect(parseIsoDate("28.02.2026")).toBeUndefined();
  });
});

describe("formatting", () => {
  it("formats German dates with four-digit years", () => {
    expect(formatGermanDate({ year: 2012, month: 1, day: 5 })).toBe("05.01.2012");
  });

  it("formats ISO dates", () => {
    expect(formatIsoDate({ year: 2026, month: 2, day: 28 })).toBe("2026-02-28");
  });

  it("round-trips German dates", () => {
    const date = parseGermanDate("31.12.12");
    expect(date && formatGermanDate(date)).toBe("31.12.2012");
  });
});

describe("calendarDateOf", () => {
  it("returns the local calendar date of an instant", () => {
    expect(calendarDateOf(new Date(2026, 1, 28, 23, 59))).toEqual({ year: 2026, month: 2, day: 28 });
  });
});
