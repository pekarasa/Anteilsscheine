import type { CalendarDate, Settings, YearData } from "../model/types";
import { calculateYearCertificates, calculateTotals } from "../logic/certificateCollection";
import { texts } from "../ui/texts";
import { decodeText, formatCsv } from "./csv";
import { formatGermanDate, formatIsoDate } from "./dates";
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
 * Writes the edited year back into the archive: all known data files, the
 * template, the settings and Summary_<year>.csv in the customer folder.
 * Unknown files stay untouched.
 */
export function saveYear(archive: Archive, folder: YearFolder, data: YearData): void {
  const put = (fileName: string, bytes: Uint8Array): void => {
    archive.set(folder.path + fileName, bytes);
  };
  put(
    yearFileNames.address,
    encodeCsv(
      ["Id", "Name", "Street", "City"],
      data.addresses.map((a) => [String(a.id), a.name, a.street, a.city]),
    ),
  );
  put(
    yearFileNames.transaction,
    encodeCsv(
      ["AddressId", "Date", "Description", "Amount"],
      data.transactions.map((t) => [
        String(t.addressId),
        formatGermanDate(t.date),
        t.description,
        String(t.amount),
      ]),
    ),
  );
  put(
    yearFileNames.dynamicShare,
    encodeCsv(
      ["AddressId", "Date", "PowerPurchase"],
      data.dynamicShares.map((s) => [String(s.addressId), formatGermanDate(s.date), String(s.powerPurchase)]),
    ),
  );
  put(
    yearFileNames.powerEarning,
    encodeCsv(
      ["Year", "Earning"],
      data.powerEarnings.map((p) => [String(p.year), String(p.earning)]),
    ),
  );
  put(
    yearFileNames.conversionFactor,
    encodeCsv(
      ["Year", "Factor"],
      data.conversionFactors.map((c) => [String(c.year), c.factor.text]),
    ),
  );
  put(yearFileNames.settings, encoder.encode(formatSettings(data.settings)));
  put(yearFileNames.document, encoder.encode(data.template.document));
  put(yearFileNames.tableHeader, encoder.encode(data.template.tableHeader));
  put(yearFileNames.tableItem, encoder.encode(data.template.tableItem));
  put(yearFileNames.tableFooter, encoder.encode(data.template.tableFooter));
  if (data.template.logo) {
    put(yearFileNames.logo, data.template.logo);
  }
  archive.set(`${customerPath(folder)}Summary_${folder.year}.csv`, encoder.encode(buildSummary(data)));
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

function encodeCsv(header: string[], rows: string[][]): Uint8Array {
  return encoder.encode(formatCsv(header, rows));
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
