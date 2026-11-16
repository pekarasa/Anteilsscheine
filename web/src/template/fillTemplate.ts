import type { Address, CalendarDate, Template, Transaction } from "../model/types";
import { formatGermanDate } from "../io/dates";
import { formatAmount } from "./formatting";

export interface LetterValues {
  year: number;
  plantPowerEarning: number;
  totalNumberOfShareCertificate: number;
  address: Address;
  personalNumberOfShareCertificate: number;
  personalPowerEarning: number;
  personalRemainingBalance: number;
  /** Transactions up to the year, sorted by date. */
  transactions: readonly Transaction[];
  /** Already formatted, e.g. "28. Februar 2026". */
  printDate: string;
  signer1: string;
  signer2: string;
}

/**
 * Replaces all ${name} placeholders in one pass. Inserted values are not
 * scanned again, and unknown placeholders stay unchanged.
 */
export function replacePlaceholders(text: string, values: ReadonlyMap<string, string>): string {
  return text.replace(/\$\{(\w+)\}/g, (placeholder: string, name: string) => {
    return values.get(name) ?? placeholder;
  });
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Builds the transaction table as in the C# tool: header, one row per
 * transaction and a total row dated 31.12. of the year. Each part is
 * followed by a line break.
 */
export function buildTransactionTable(
  template: Template,
  year: number,
  transactions: readonly Transaction[],
): string {
  const rows = transactions.map((transaction) =>
    fillTableRow(template.tableItem, transaction.date, transaction.description, transaction.amount),
  );
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const endOfYear: CalendarDate = { year, month: 12, day: 31 };
  const footer = fillTableRow(template.tableFooter, endOfYear, "Total", total);
  return [template.tableHeader, ...rows, footer].map((part) => `${part}\n`).join("");
}

/** Fills the document template of one letter. */
export function fillLetter(template: Template, values: LetterValues): string {
  const placeholders = new Map<string, string>([
    ["year", String(values.year)],
    ["plantPowerEarning", String(values.plantPowerEarning)],
    ["addressName", escapeHtml(values.address.name)],
    ["addressStreet", escapeHtml(values.address.street)],
    ["addressCity", escapeHtml(values.address.city)],
    ["personalNumberOfShareCertificate", String(values.personalNumberOfShareCertificate)],
    ["personalPowerEarning", String(values.personalPowerEarning)],
    ["transactionTable", buildTransactionTable(template, values.year, values.transactions)],
    ["personalRemainingBalance", String(values.personalRemainingBalance)],
    ["totalNumberOfShareCertificate", String(values.totalNumberOfShareCertificate)],
    ["printDate", escapeHtml(values.printDate)],
    ["signer1", escapeHtml(values.signer1)],
    ["signer2", escapeHtml(values.signer2)],
  ]);
  return replacePlaceholders(template.document, placeholders);
}

function fillTableRow(
  rowTemplate: string,
  date: CalendarDate,
  description: string,
  amount: number,
): string {
  return replacePlaceholders(
    rowTemplate,
    new Map([
      ["Date", escapeHtml(formatGermanDate(date))],
      ["Description", escapeHtml(description)],
      ["Amount", escapeHtml(formatAmount(amount))],
    ]),
  );
}
