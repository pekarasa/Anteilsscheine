import { describe, expect, it } from "vitest";
import { addRow, nextIntegerValue, removeRow, setCell } from "../src/io/tableEdit";
import type { RawTable } from "../src/model/types";

const table: RawTable = {
  header: ["Id", "Name"],
  rows: [
    { line: 2, cells: ["101", "Maya Graf"] },
    { line: 3, cells: ["7", "Tim Stern"] },
  ],
};

describe("setCell", () => {
  it("changes one cell and keeps the other rows", () => {
    const next = setCell(table, 1, "Name", "Tina Stern");
    expect(next.rows[1]?.cells).toEqual(["7", "Tina Stern"]);
    expect(next.rows[0]).toBe(table.rows[0]);
  });

  it("keeps the line of the row", () => {
    expect(setCell(table, 0, "Id", "102").rows[0]?.line).toBe(2);
  });

  it("does not change the original table", () => {
    setCell(table, 0, "Id", "102");
    expect(table.rows[0]?.cells[0]).toBe("101");
  });

  it("ignores unknown columns", () => {
    expect(setCell(table, 0, "Unknown", "x")).toBe(table);
  });
});

describe("addRow", () => {
  it("appends an empty row aligned with the header", () => {
    const next = addRow(table);
    expect(next.rows.at(-1)).toEqual({ cells: ["", ""] });
  });

  it("fills the given columns only", () => {
    const next = addRow(table, { Id: "8" });
    expect(next.rows.at(-1)?.cells).toEqual(["8", ""]);
  });
});

describe("removeRow", () => {
  it("removes the row at the index", () => {
    const next = removeRow(table, 0);
    expect(next.rows).toEqual([table.rows[1]]);
  });
});

describe("nextIntegerValue", () => {
  it("suggests one more than the largest value", () => {
    expect(nextIntegerValue(table, "Id")).toBe(102);
  });

  it("ignores values that are not integers", () => {
    const messy: RawTable = { header: ["Id"], rows: [{ cells: ["x"] }, { cells: [" 5 "] }] };
    expect(nextIntegerValue(messy, "Id")).toBe(6);
  });

  it("starts with 1 for an empty table", () => {
    expect(nextIntegerValue({ header: ["Id"], rows: [] }, "Id")).toBe(1);
  });
});
