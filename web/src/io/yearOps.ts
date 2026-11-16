import type { CalendarDate, RawTable, Settings, YearData, YearModel } from "../model/types";
import { calculateYearCertificates, calculateTotals } from "../logic/certificateCollection";
import { texts } from "../ui/texts";
import { decodeText, formatCsv } from "./csv";
import { formatGermanDate, formatIsoDate, parseGermanDate } from "./dates";
import { findYearFolders, getYearFile, yearFileNames, type Archive, type YearFolder } from "./zip";

const encoder = new TextEncoder();
const summaryColumns = [
  "Id",
  "Name",
  "Street",
  "City",
  "NumberOfCertificatesHeld",
  "RemainingBalance",
  "NumberOfCommittedCertificates",
];

/**
 * Writes the year back into the archive. Invalid values are written as they
 * are, so nothing is lost. Valid dates are written as dd.MM.yyyy. The summary
 * is written only when the data is valid; an old summary is removed otherwise.
 * Unknown files stay untouched.
 */
export function saveYear(archive: Archive, folder: YearFolder, model: YearModel, data?: YearData): void {
  const put = (fileName: string, bytes: Uint8Array): void => {
    archive.set(folder.path + fileName, bytes);
  };
  put(yearFileNames.address, encodeTable(model.address, []));
  put(yearFileNames.transaction, encodeTable(model.transaction, ["Date"]));
  put(yearFileNames.dynamicShare, encodeTable(model.dynamicShare, ["Date"]));
  put(yearFileNames.powerEarning, encodeTable(model.powerEarning, []));
  put(yearFileNames.conversionFactor, encodeTable(model.conversionFactor, []));
  if (model.settings) {
    put(yearFileNames.settings, encoder.encode(formatSettings(model.settings)));
  }
  put(yearFileNames.document, encoder.encode(model.template.document));
  put(yearFileNames.tableHeader, encoder.encode(model.template.tableHeader));
  put(yearFileNames.tableItem, encoder.encode(model.template.tableItem));
  put(yearFileNames.tableFooter, encoder.encode(model.template.tableFooter));
  if (model.template.logo) {
    put(yearFileNames.logo, model.template.logo);
  }
  const summaryPath = `${customerPath(folder)}Summary_${folder.year}.csv`;
  const summary = data ? summaryOf(data) : undefined;
  if (summary !== undefined) {
    archive.set(summaryPath, encoder.encode(summary));
  } else {
    archive.delete(summaryPath);
  }
}

/** Undefined while the year lacks a power earning or a conversion factor. */
function summaryOf(data: YearData): string | undefined {
  try {
    return buildSummary(data);
  } catch {
    return undefined;
  }
}

/**
 * Copies a year as the basis of a new year. Generated PDFs are not copied.
 * printDate becomes today, the signers are kept.
 */
export function createYear(
  archive: Archive,
  source: YearFolder,
  targetYear: number,
  today: CalendarDate,
): YearFolder {
  if (!Number.isInteger(targetYear) || targetYear < 1000 || targetYear > 9999) {
    throw new Error(texts.yearOps.invalidYear);
  }
  const exists = findYearFolders(archive).some(
    (folder) => folder.customer === source.customer && folder.year === targetYear,
  );
  if (exists) {
    throw new Error(texts.yearOps.yearExists(targetYear));
  }
  const targetPath = `${customerPath(source)}${targetYear}/`;
  const generatedPath = `${source.path}Generated/`;
  const sourceFiles = [...archive].filter(
    ([path]) => path.startsWith(source.path) && !path.startsWith(generatedPath),
  );
  for (const [path, bytes] of sourceFiles) {
    archive.set(targetPath + path.slice(source.path.length), bytes);
  }
  const sourceSettings = getYearFile(archive, source, yearFileNames.settings);
  archive.set(
    targetPath + yearFileNames.settings,
    encoder.encode(formatSettings(copiedSettings(sourceSettings, today))),
  );
  const created = findYearFolders(archive).find(
    (folder) => folder.customer === source.customer && folder.year === targetYear,
  );
  if (!created) {
    throw new Error(texts.yearOps.yearExists(targetYear));
  }
  return created;
}

/** The summary in the format of the C# program ("Year: ...", ", " separated). */
export function buildSummary(data: YearData): string {
  const certificates = calculateYearCertificates(data);
  const totals = calculateTotals(certificates);
  const lines = [
    `Year: ${data.year}`,
    summaryLine(summaryColumns),
    ...certificates.map((c) =>
      summaryLine([
        String(c.address.id),
        c.address.name,
        c.address.street,
        c.address.city,
        String(c.numberOfCertificatesHeld),
        String(c.remainingBalance),
        String(c.numberOfCommittedCertificates),
      ]),
    ),
    summaryLine([
      "999",
      "Total",
      "",
      "",
      String(totals.totalNumberOfCertificates),
      String(totals.totalRemainingBalance),
      String(totals.totalNumberOfCommittedCertificates),
    ]),
  ];
  return `${lines.join("\n")}\n`;
}

function customerPath(folder: YearFolder): string {
  return folder.path.slice(0, folder.path.length - `${folder.year}/`.length);
}

function encodeTable(table: RawTable, dateColumns: string[]): Uint8Array {
  const rows = table.rows
    .filter((row) => row.cells.some((cell) => cell !== ""))
    .map((row) =>
      row.cells.map((cell, index) => {
        const column = table.header[index] ?? "";
        const date = dateColumns.includes(column) ? parseGermanDate(cell) : undefined;
        return date ? formatGermanDate(date) : cell;
      }),
    );
  return encoder.encode(formatCsv(table.header, rows));
}

function summaryLine(cells: string[]): string {
  return cells.map((cell) => (/[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(", ");
}

function formatSettings(settings: Settings): string {
  return `${JSON.stringify(settings, null, 2)}\n`;
}

function copiedSettings(bytes: Uint8Array | undefined, today: CalendarDate): Settings {
  const values = readJsonObject(bytes);
  return {
    printDate: formatIsoDate(today),
    signer1: typeof values["signer1"] === "string" ? values["signer1"] : "",
    signer2: typeof values["signer2"] === "string" ? values["signer2"] : "",
  };
}

function readJsonObject(bytes: Uint8Array | undefined): Record<string, unknown> {
  if (!bytes) {
    return {};
  }
  try {
    const json: unknown = JSON.parse(decodeText(bytes).text);
    return typeof json === "object" && json !== null && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
