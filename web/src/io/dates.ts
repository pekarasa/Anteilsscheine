import type { CalendarDate } from "../model/types";

const germanDatePattern = /^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/;
const dateInputPattern = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/;
const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Accepts dd.MM.yy (20xx) and dd.MM.yyyy. Returns undefined for invalid dates. */
export function parseGermanDate(text: string): CalendarDate | undefined {
  const match = germanDatePattern.exec(text.trim());
  return match ? dateFromMatch(match) : undefined;
}

/** Tolerant input for typing: also accepts one-digit day and month, e.g. 9.12.11. */
export function parseDateInput(text: string): CalendarDate | undefined {
  const match = dateInputPattern.exec(text.trim());
  return match ? dateFromMatch(match) : undefined;
}

function dateFromMatch(match: RegExpExecArray): CalendarDate | undefined {
  const yearText = match[3] ?? "";
  const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
  return toValidDate({ year, month: Number(match[2]), day: Number(match[1]) });
}

/** Accepts yyyy-MM-dd as used in Settings.json. */
export function parseIsoDate(text: string): CalendarDate | undefined {
  const match = isoDatePattern.exec(text.trim());
  if (!match) {
    return undefined;
  }
  return toValidDate({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  });
}

/** The local calendar date of a point in time, without time zone shifts. */
export function calendarDateOf(instant: Date): CalendarDate {
  return { year: instant.getFullYear(), month: instant.getMonth() + 1, day: instant.getDate() };
}

export function formatGermanDate(date: CalendarDate): string {
  return `${pad(date.day, 2)}.${pad(date.month, 2)}.${pad(date.year, 4)}`;
}

export function formatIsoDate(date: CalendarDate): string {
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

function toValidDate(date: CalendarDate): CalendarDate | undefined {
  if (date.month < 1 || date.month > 12 || date.day < 1) {
    return undefined;
  }
  return date.day <= daysInMonth(date.year, date.month) ? date : undefined;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}
