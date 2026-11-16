import { describe, expect, it } from "vitest";
import { cellKindOf, cellProblem, displayCell, normalizeCell } from "../src/io/cells";

describe("cellKindOf", () => {
  it("derives the kind from the column name", () => {
    expect(cellKindOf("AddressId")).toBe("address");
    expect(cellKindOf("Date")).toBe("date");
    expect(cellKindOf("Factor")).toBe("decimal");
    expect(cellKindOf("Amount")).toBe("integer");
    expect(cellKindOf("Description")).toBe("text");
    expect(cellKindOf("Unknown")).toBe("text");
  });
});

describe("normalizeCell", () => {
  it("writes typed dates as dd.MM.yyyy", () => {
    expect(normalizeCell("date", "9.12.11")).toBe("09.12.2011");
    expect(normalizeCell("date", " 31.12.26 ")).toBe("31.12.2026");
  });

  it("keeps invalid dates as typed, without the surrounding spaces", () => {
    expect(normalizeCell("date", " 31.02.2026 ")).toBe("31.02.2026");
  });

  it("trims numbers but keeps text unchanged", () => {
    expect(normalizeCell("integer", " 42 ")).toBe("42");
    expect(normalizeCell("text", " Name ")).toBe(" Name ");
  });
});

describe("displayCell", () => {
  it("shows valid stored dates as dd.MM.yyyy", () => {
    expect(displayCell("date", "31.12.12")).toBe("31.12.2012");
  });

  it("shows values that the file validation rejects unchanged", () => {
    expect(displayCell("date", "9.12.11")).toBe("9.12.11");
    expect(displayCell("integer", "12.5")).toBe("12.5");
  });
});

describe("cellProblem", () => {
  it("accepts valid values of every kind", () => {
    expect(cellProblem("integer", " -12 ")).toBeUndefined();
    expect(cellProblem("decimal", "0.8")).toBeUndefined();
    expect(cellProblem("date", "31.12.2026")).toBeUndefined();
    expect(cellProblem("text", "")).toBeUndefined();
  });

  it("reports invalid integers and decimals as errors", () => {
    expect(cellProblem("integer", "12.5")?.severity).toBe("error");
    expect(cellProblem("integer", "")?.severity).toBe("error");
    expect(cellProblem("decimal", "0,8")?.message).toContain("0,8");
  });

  it("reports dates that the file validation rejects", () => {
    expect(cellProblem("date", "9.12.11")?.severity).toBe("error");
    expect(cellProblem("date", "31.02.2026")?.severity).toBe("error");
  });

  it("reports unknown address IDs as warnings only when the list is given", () => {
    expect(cellProblem("address", "7")).toBeUndefined();
    expect(cellProblem("address", "7", new Set([101]))?.severity).toBe("warning");
    expect(cellProblem("address", "101", new Set([101]))).toBeUndefined();
    expect(cellProblem("address", "x", new Set([101]))?.severity).toBe("error");
  });
});
