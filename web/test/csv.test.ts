import { describe, expect, it } from "vitest";
import { decodeText, formatCsv, parseCsv } from "../src/io/csv";

const encoder = new TextEncoder();

describe("decodeText", () => {
  it("reads UTF-8 without BOM", () => {
    expect(decodeText(encoder.encode("Mattenweg 183b"))).toEqual({
      text: "Mattenweg 183b",
      encoding: "utf-8",
      hasBom: false,
    });
  });

  it("removes a UTF-8 BOM", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode("Id,Name")]);
    expect(decodeText(bytes)).toEqual({ text: "Id,Name", encoding: "utf-8", hasBom: true });
  });

  it("falls back to Windows-1252 for invalid UTF-8", () => {
    const bytes = new Uint8Array([0x4d, 0xf6, 0x6e, 0x63, 0x68]);
    expect(decodeText(bytes)).toEqual({ text: "Mönch", encoding: "windows-1252", hasBom: false });
  });
});

describe("parseCsv", () => {
  it("reads header and rows with line numbers", () => {
    const table = parseCsv("Id,Name\r\n101,Maya Graf\r\n102,Janiak\r\n");
    expect(table.delimiter).toBe(",");
    expect(table.header).toEqual(["Id", "Name"]);
    expect(table.rows).toEqual([
      { line: 2, cells: ["101", "Maya Graf"] },
      { line: 3, cells: ["102", "Janiak"] },
    ]);
    expect(table.errors).toEqual([]);
  });

  it("detects a semicolon delimiter", () => {
    const table = parseCsv("Id;Name\n101;Maya Graf\n");
    expect(table.delimiter).toBe(";");
    expect(table.rows).toEqual([{ line: 2, cells: ["101", "Maya Graf"] }]);
  });

  it("keeps commas inside quoted cells", () => {
    const table = parseCsv('AddressId,Date,Description,Amount\n101,01.02.2015,"A, B",-5000\n');
    expect(table.rows[0]?.cells).toEqual(["101", "01.02.2015", "A, B", "-5000"]);
  });

  it("skips empty lines but keeps line numbers of the others", () => {
    const table = parseCsv("Year,Earning\n\n2012,50965\n");
    expect(table.rows).toEqual([{ line: 3, cells: ["2012", "50965"] }]);
  });

  it("reports unbalanced quotes", () => {
    const table = parseCsv('Id,Name\n101,"Maya\n');
    expect(table.errors.length).toBeGreaterThan(0);
    expect(table.errors[0]?.line).toBeGreaterThan(1);
  });
});

describe("formatCsv", () => {
  it("writes a header and rows with CRLF line endings", () => {
    expect(formatCsv(["Year", "Factor"], [["2012", "0.8"]])).toBe("Year,Factor\r\n2012,0.8\r\n");
  });

  it("writes only the header when there are no rows", () => {
    expect(formatCsv(["Year", "Earning"], [])).toBe("Year,Earning\r\n");
  });

  it("quotes cells that contain the delimiter or quotes", () => {
    const text = formatCsv(["Name"], [['Brenzikofer, "Tobias"']]);
    expect(text).toBe('Name\r\n"Brenzikofer, ""Tobias"""\r\n');
  });

  it("round-trips through parseCsv", () => {
    const header = ["AddressId", "Date", "Description", "Amount"];
    const rows = [["101", "09.12.2011", "Kauf; Anteile, 2'500.-", "-200"]];
    const table = parseCsv(formatCsv(header, rows));
    expect(table.header).toEqual(header);
    expect(table.rows.map((row) => row.cells)).toEqual(rows);
  });
});
