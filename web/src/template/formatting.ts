import type { CalendarDate } from "../model/types";
import { parseIsoDate } from "../io/dates";
import { texts } from "../ui/texts";

const thousandsSeparator = "\u2019";

const germanMonthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/**
 * Formats an amount like the C# format "##,#" in de-CH. Zero gives an empty
 * string, as in .NET.
 */
export function formatAmount(amount: number): string {
  if (amount === 0) {
    return "";
  }
  const digits = String(Math.abs(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  return amount < 0 ? `-${digits}` : digits;
}

/** Turns the ISO date of Settings.json into a text like "28. Februar 2026". */
export function formatPrintDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) {
    throw new Error(texts.issues.invalidSettings("printDate"));
  }
  return formatLongGermanDate(date);
}

export function formatLongGermanDate(date: CalendarDate): string {
  return `${date.day}. ${germanMonthNames[date.month - 1]} ${date.year}`;
}
