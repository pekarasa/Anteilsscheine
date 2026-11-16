import { parseDecimal } from "../logic/decimal";
import { texts } from "../ui/texts";
import { formatGermanDate, parseDateInput, parseGermanDate } from "./dates";

export type CellKind = "text" | "integer" | "decimal" | "date" | "address";

export interface CellProblem {
  severity: "error" | "warning";
  message: string;
}

const columnKinds: Record<string, CellKind> = {
  Id: "integer",
  AddressId: "address",
  Date: "date",
  Amount: "integer",
  PowerPurchase: "integer",
  Year: "integer",
  Earning: "integer",
  Factor: "decimal",
};

/** The kind of a column, derived from its name. Unknown columns are plain text. */
export function cellKindOf(column: string): CellKind {
  return columnKinds[column] ?? "text";
}

/** The value as it is stored after the user has edited a cell. */
export function normalizeCell(kind: CellKind, text: string): string {
  if (kind === "text") {
    return text;
  }
  const trimmed = text.trim();
  if (kind === "date") {
    const date = parseDateInput(trimmed);
    return date ? formatGermanDate(date) : trimmed;
  }
  return trimmed;
}

/** The value as it is shown: valid dates as dd.MM.yyyy, everything else unchanged. */
export function displayCell(kind: CellKind, value: string): string {
  if (kind !== "date") {
    return value;
  }
  const date = parseGermanDate(value);
  return date ? formatGermanDate(date) : value;
}

/**
 * Checks one stored value with the same rules as the file validation.
 * Address IDs that are not in the address list are only a warning.
 */
export function cellProblem(
  kind: CellKind,
  value: string,
  addressIds?: ReadonlySet<number>,
): CellProblem | undefined {
  const text = value.trim();
  switch (kind) {
    case "text":
      return undefined;
    case "integer":
      return /^-?\d+$/.test(text) ? undefined : problem("error", texts.cells.invalidInteger);
    case "address":
      if (!/^-?\d+$/.test(text)) {
        return problem("error", texts.cells.invalidInteger);
      }
      return addressIds && !addressIds.has(Number(text))
        ? problem("warning", texts.cells.unknownAddress(text))
        : undefined;
    case "decimal":
      return decimalProblem(text);
    case "date":
      return parseGermanDate(text) ? undefined : problem("error", texts.cells.invalidDate);
  }
}

function decimalProblem(text: string): CellProblem | undefined {
  try {
    parseDecimal(text);
    return undefined;
  } catch (failure) {
    return problem("error", failure instanceof Error ? failure.message : texts.cells.invalidDecimal);
  }
}

function problem(severity: CellProblem["severity"], message: string): CellProblem {
  return { severity, message };
}
