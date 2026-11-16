import type { RawTable } from "../model/types";

/** Returns a copy of the table with one cell changed. Unknown columns leave it unchanged. */
export function setCell(table: RawTable, rowIndex: number, column: string, value: string): RawTable {
  const position = table.header.indexOf(column);
  if (position < 0) {
    return table;
  }
  return {
    header: table.header,
    rows: table.rows.map((row, index) =>
      index === rowIndex
        ? { ...row, cells: row.cells.map((cell, cellIndex) => (cellIndex === position ? value : cell)) }
        : row,
    ),
  };
}

/** Appends a row. Columns without a given value stay empty. */
export function addRow(table: RawTable, values: Record<string, string> = {}): RawTable {
  return {
    header: table.header,
    rows: [...table.rows, { cells: table.header.map((column) => values[column] ?? "") }],
  };
}

export function removeRow(table: RawTable, rowIndex: number): RawTable {
  return { header: table.header, rows: table.rows.filter((_, index) => index !== rowIndex) };
}

/** One more than the largest integer in the column, or 1 if there is none. */
export function nextIntegerValue(table: RawTable, column: string): number {
  const position = table.header.indexOf(column);
  const values = table.rows
    .map((row) => row.cells[position]?.trim() ?? "")
    .filter((text) => /^-?\d+$/.test(text))
    .map(Number);
  return values.length > 0 ? Math.max(...values) + 1 : 1;
}
