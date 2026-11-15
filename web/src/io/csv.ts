import Papa from "papaparse";

export type CsvEncoding = "utf-8" | "windows-1252";
export type CsvDelimiter = "," | ";";

export interface DecodedText {
  text: string;
  encoding: CsvEncoding;
  hasBom: boolean;
}

export interface CsvRow {
  /** 1-based line number in the file, used in messages. */
  line: number;
  cells: string[];
}

export interface CsvParseError {
  line: number;
  message: string;
}

export interface CsvTable {
  delimiter: CsvDelimiter;
  header: string[];
  rows: CsvRow[];
  errors: CsvParseError[];
}

const utf8Bom = [0xef, 0xbb, 0xbf];

/** Decodes UTF-8 (with or without BOM) and falls back to Windows-1252. */
export function decodeText(bytes: Uint8Array): DecodedText {
  const hasBom = utf8Bom.every((value, i) => bytes[i] === value);
  const body = hasBom ? bytes.subarray(utf8Bom.length) : bytes;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    return { text, encoding: "utf-8", hasBom };
  } catch {
    const text = new TextDecoder("windows-1252").decode(body);
    return { text, encoding: "windows-1252", hasBom };
  }
}

export function parseCsv(text: string): CsvTable {
  const delimiter = detectDelimiter(text);
  const result = Papa.parse<string[]>(text, {
    delimiter,
    header: false,
    skipEmptyLines: false,
  });
  const [headerRow = [], ...dataRows] = result.data;
  const rows = dataRows
    .map((cells, index) => ({ line: index + 2, cells }))
    .filter((row) => row.cells.some((cell) => cell !== ""));
  const errors = result.errors.map((error) => ({
    line: (error.row ?? 0) + 1,
    message: error.message,
  }));
  return {
    delimiter,
    header: headerRow.map((cell) => cell.trim()),
    rows,
    errors,
  };
}

/** Writes UTF-8 without BOM, always with "," and CRLF like the C# files. */
export function formatCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const text = Papa.unparse(
    { fields: [...header], data: rows.map((row) => [...row]) },
    { delimiter: ",", newline: "\r\n" },
  );
  return text.endsWith("\r\n") ? text : `${text}\r\n`;
}

function detectDelimiter(text: string): CsvDelimiter {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const semicolons = firstLine.split(";").length - 1;
  const commas = firstLine.split(",").length - 1;
  return semicolons > commas ? ";" : ",";
}
