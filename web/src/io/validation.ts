import type {
  Address,
  CalendarDate,
  ConversionFactor,
  DecimalValue,
  DynamicShare,
  PowerEarning,
  RawRow,
  RawTable,
  Settings,
  Template,
  Transaction,
  YearData,
  YearModel,
} from "../model/types";
import { parseDecimal } from "../logic/decimal";
import { texts } from "../ui/texts";
import { decodeText, parseCsv } from "./csv";
import { formatIsoDate, parseGermanDate, parseIsoDate } from "./dates";
import { getYearFile, yearFileNames, type Archive, type YearFolder } from "./zip";

export type IssueSeverity = "error" | "warning";

export interface Issue {
  severity: IssueSeverity;
  file: string;
  line?: number;
  message: string;
}

export interface YearReadResult {
  /** The stored data including invalid values. Undefined if files are missing. */
  model?: YearModel;
  /** Typed data. Undefined as long as any value is invalid. */
  data?: YearData;
  issues: Issue[];
  /** Issues about the files as they were read, e.g. encoding or CSV syntax. */
  fileIssues: Issue[];
}

export interface MissingYearData {
  powerEarning: boolean;
  /** Years with a dynamic share but without a conversion factor, sorted. */
  conversionFactorYears: number[];
}

const placeholderNames = new Set([
  "year",
  "plantPowerEarning",
  "addressName",
  "addressStreet",
  "addressCity",
  "personalNumberOfShareCertificate",
  "personalPowerEarning",
  "transactionTable",
  "personalRemainingBalance",
  "totalNumberOfShareCertificate",
  "printDate",
  "signer1",
  "signer2",
  "Date",
  "Description",
  "Amount",
]);

const templateFileNames = [
  yearFileNames.document,
  yearFileNames.tableHeader,
  yearFileNames.tableItem,
  yearFileNames.tableFooter,
] as const;

const csvFileNames = [
  yearFileNames.address,
  yearFileNames.transaction,
  yearFileNames.dynamicShare,
  yearFileNames.powerEarning,
  yearFileNames.conversionFactor,
] as const;

interface CsvRecord {
  line?: number;
  get(column: string): string;
}

interface Mapped<T> {
  items: T[];
  lines: (number | undefined)[];
}

type Fail = (message: string) => void;

/**
 * Reads all files of one year folder into the model. Missing files leave the
 * model undefined. Invalid values keep the model, but leave `data` undefined.
 * Semantic problems (duplicate IDs, missing power earning, ...) are reported
 * as issues while `data` is still returned.
 */
export function readYear(archive: Archive, folder: YearFolder, today: CalendarDate): YearReadResult {
  const issues: Issue[] = [];
  const missing = [...csvFileNames, ...templateFileNames].filter(
    (name) => getYearFile(archive, folder, name) === undefined,
  );
  for (const name of missing) {
    issues.push(errorIssue(name, texts.issues.missingFile(name)));
  }
  if (missing.length > 0) {
    return { issues, fileIssues: issues };
  }

  const read = new FileReader(archive, folder, issues);
  const model: YearModel = {
    year: folder.year,
    address: read.table(yearFileNames.address),
    transaction: read.table(yearFileNames.transaction),
    dynamicShare: read.table(yearFileNames.dynamicShare),
    powerEarning: read.table(yearFileNames.powerEarning),
    conversionFactor: read.table(yearFileNames.conversionFactor),
    template: readTemplate(read),
    settings: readSettings(read, today),
  };
  return checkYear(model, issues);
}

/**
 * Checks a model, for example after the user has changed it. The issues about
 * the files as read are kept as given; all other issues are computed again.
 */
export function checkYear(model: YearModel, fileIssues: Issue[]): YearReadResult {
  const readFailed = fileIssues.some((issue) => issue.severity === "error");
  const converted = toYearData(model);
  return {
    model,
    data: readFailed ? undefined : converted.data,
    issues: [...fileIssues, ...converted.issues],
    fileIssues,
  };
}

/**
 * Finds what the year still lacks for the summary. Reads the raw values, so it
 * also works while other values are invalid.
 */
export function findMissingYearData(model: YearModel): MissingYearData {
  const earningYears = integerValues(model.powerEarning, "Year");
  const factorYears = new Set(integerValues(model.conversionFactor, "Year"));
  const shareYears = dateValues(model.dynamicShare, "Date").map((date) => date.year);
  const missingYears = [...new Set(shareYears.filter((year) => !factorYears.has(year)))];
  return {
    powerEarning: !earningYears.includes(model.year),
    conversionFactorYears: missingYears.sort((a, b) => a - b),
  };
}

function integerValues(table: RawTable, column: string): number[] {
  return cellTexts(table, column)
    .filter((text) => /^-?\d+$/.test(text))
    .map(Number);
}

function dateValues(table: RawTable, column: string): CalendarDate[] {
  return cellTexts(table, column).flatMap((text) => {
    const date = parseGermanDate(text);
    return date ? [date] : [];
  });
}

function cellTexts(table: RawTable, column: string): string[] {
  const position = table.header.indexOf(column);
  return table.rows.map((row) => (row.cells[position] ?? "").trim());
}

/**
 * Converts the stored values into typed data. Returns no data as long as a
 * required column is missing, a value is invalid or the settings are invalid.
 */
export function toYearData(model: YearModel): { data?: YearData; issues: Issue[] } {
  const issues: Issue[] = [];
  const addresses = convertTable(model.address, yearFileNames.address, ["Id", "Name", "Street", "City"], mapAddress, issues);
  const transactions = convertTable(
    model.transaction,
    yearFileNames.transaction,
    ["AddressId", "Date", "Description", "Amount"],
    mapTransaction,
    issues,
  );
  const dynamicShares = convertTable(
    model.dynamicShare,
    yearFileNames.dynamicShare,
    ["AddressId", "Date", "PowerPurchase"],
    mapDynamicShare,
    issues,
  );
  const powerEarnings = convertTable(
    model.powerEarning,
    yearFileNames.powerEarning,
    ["Year", "Earning"],
    mapPowerEarning,
    issues,
  );
  const conversionFactors = convertTable(
    model.conversionFactor,
    yearFileNames.conversionFactor,
    ["Year", "Factor"],
    mapConversionFactor,
    issues,
  );

  if (!addresses || !transactions || !dynamicShares || !powerEarnings || !conversionFactors || !model.settings) {
    return { issues };
  }

  const data: YearData = {
    year: model.year,
    addresses: addresses.items,
    transactions: transactions.items,
    dynamicShares: dynamicShares.items,
    powerEarnings: powerEarnings.items,
    conversionFactors: conversionFactors.items,
    template: model.template,
    settings: model.settings,
  };

  checkAddresses(addresses, issues);
  checkTransactions(data, transactions, issues);
  checkDynamicShares(data, dynamicShares, issues);
  checkPowerEarnings(data, powerEarnings, issues);
  checkConversionFactors(conversionFactors, issues);
  return { data, issues };
}

export function describeIssue(issue: Issue): string {
  return `${texts.issues.location(issue.file, issue.line)}: ${issue.message}`;
}

class FileReader {
  constructor(
    private readonly archive: Archive,
    private readonly folder: YearFolder,
    private readonly issues: Issue[],
  ) {}

  bytes(fileName: string): Uint8Array | undefined {
    return getYearFile(this.archive, this.folder, fileName);
  }

  text(fileName: string): string | undefined {
    const bytes = this.bytes(fileName);
    if (!bytes) {
      return undefined;
    }
    const decoded = decodeText(bytes);
    if (decoded.encoding !== "utf-8") {
      this.issues.push(warningIssue(fileName, texts.issues.encodingFallback(fileName)));
    }
    return decoded.text;
  }

  table(fileName: string): RawTable {
    const parsed = parseCsv(this.text(fileName) ?? "");
    for (const error of parsed.errors) {
      this.issues.push(errorIssue(fileName, texts.issues.invalidCsvLine, error.line));
    }
    return {
      header: parsed.header,
      rows: parsed.rows.map((row) => ({
        line: row.line,
        cells: padCells(row.cells, parsed.header.length),
      })),
    };
  }

  push(issue: Issue): void {
    this.issues.push(issue);
  }
}

function padCells(cells: string[], length: number): string[] {
  return cells.length >= length ? cells : [...cells, ...Array<string>(length - cells.length).fill("")];
}

function convertTable<T>(
  table: RawTable,
  fileName: string,
  columns: readonly string[],
  mapper: (record: CsvRecord, fail: Fail) => T | undefined,
  issues: Issue[],
): Mapped<T> | undefined {
  const missing = columns.filter((column) => !table.header.includes(column));
  if (missing.length > 0) {
    issues.push(errorIssue(fileName, texts.issues.missingColumns(missing)));
    return undefined;
  }
  let valid = true;
  const items: T[] = [];
  const lines: (number | undefined)[] = [];
  for (const row of table.rows) {
    const record = recordOf(table, row);
    const fail: Fail = (message) => {
      valid = false;
      issues.push(errorIssue(fileName, message, row.line));
    };
    const item = mapper(record, fail);
    if (item === undefined) {
      valid = false;
    } else {
      items.push(item);
      lines.push(row.line);
    }
  }
  return valid ? { items, lines } : undefined;
}

function recordOf(table: RawTable, row: RawRow): CsvRecord {
  return {
    line: row.line,
    get: (column) => row.cells[table.header.indexOf(column)] ?? "",
  };
}

function mapAddress(record: CsvRecord, fail: Fail): Address | undefined {
  const id = integerCell(record, "Id", fail);
  if (id === undefined) {
    return undefined;
  }
  return {
    id,
    name: record.get("Name"),
    street: record.get("Street"),
    city: record.get("City"),
  };
}

function mapTransaction(record: CsvRecord, fail: Fail): Transaction | undefined {
  const addressId = integerCell(record, "AddressId", fail);
  const date = dateCell(record, "Date", fail);
  const amount = integerCell(record, "Amount", fail);
  if (addressId === undefined || date === undefined || amount === undefined) {
    return undefined;
  }
  return { addressId, date, description: record.get("Description"), amount };
}

function mapDynamicShare(record: CsvRecord, fail: Fail): DynamicShare | undefined {
  const addressId = integerCell(record, "AddressId", fail);
  const date = dateCell(record, "Date", fail);
  const powerPurchase = integerCell(record, "PowerPurchase", fail);
  if (addressId === undefined || date === undefined || powerPurchase === undefined) {
    return undefined;
  }
  return { addressId, date, powerPurchase };
}

function mapPowerEarning(record: CsvRecord, fail: Fail): PowerEarning | undefined {
  const year = integerCell(record, "Year", fail);
  const earning = integerCell(record, "Earning", fail);
  if (year === undefined || earning === undefined) {
    return undefined;
  }
  return { year, earning };
}

function mapConversionFactor(record: CsvRecord, fail: Fail): ConversionFactor | undefined {
  const year = integerCell(record, "Year", fail);
  const factor = decimalCell(record, "Factor", fail);
  if (year === undefined || factor === undefined) {
    return undefined;
  }
  return { year, factor };
}

function integerCell(record: CsvRecord, column: string, fail: Fail): number | undefined {
  const text = record.get(column).trim();
  if (!/^-?\d+$/.test(text)) {
    fail(texts.issues.invalidInteger(column, text));
    return undefined;
  }
  return Number(text);
}

function dateCell(record: CsvRecord, column: string, fail: Fail): CalendarDate | undefined {
  const text = record.get(column);
  const date = parseGermanDate(text);
  if (!date) {
    fail(texts.issues.invalidDate(column, text));
  }
  return date;
}

function decimalCell(record: CsvRecord, column: string, fail: Fail): DecimalValue | undefined {
  try {
    return parseDecimal(record.get(column));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

function readSettings(read: FileReader, today: CalendarDate): Settings | undefined {
  const text = read.text(yearFileNames.settings);
  if (text === undefined) {
    read.push(warningIssue(yearFileNames.settings, texts.issues.settingsMissing));
    return { printDate: formatIsoDate(today), signer1: "", signer2: "" };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    read.push(errorIssue(yearFileNames.settings, texts.issues.invalidJson));
    return undefined;
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    read.push(errorIssue(yearFileNames.settings, texts.issues.invalidJson));
    return undefined;
  }
  const values = json as Record<string, unknown>;
  const printDateText = values["printDate"];
  const printDate = typeof printDateText === "string" ? parseIsoDate(printDateText) : undefined;
  if (!printDate) {
    read.push(errorIssue(yearFileNames.settings, texts.issues.invalidSettings("printDate")));
    return undefined;
  }
  const signer1 = optionalSigner(values, "signer1", read);
  const signer2 = optionalSigner(values, "signer2", read);
  if (signer1 === undefined || signer2 === undefined) {
    return undefined;
  }
  return { printDate: formatIsoDate(printDate), signer1, signer2 };
}

function optionalSigner(values: Record<string, unknown>, field: string, read: FileReader): string | undefined {
  const value = values[field];
  if (value === undefined) {
    return "";
  }
  if (typeof value !== "string") {
    read.push(errorIssue(yearFileNames.settings, texts.issues.invalidSettings(field)));
    return undefined;
  }
  return value;
}

function readTemplate(read: FileReader): Template {
  const document = read.text(yearFileNames.document) ?? "";
  const tableHeader = read.text(yearFileNames.tableHeader) ?? "";
  const tableItem = read.text(yearFileNames.tableItem) ?? "";
  const tableFooter = read.text(yearFileNames.tableFooter) ?? "";
  const template: Template = { document, tableHeader, tableItem, tableFooter };
  const logo = read.bytes(yearFileNames.logo);
  if (logo) {
    template.logo = logo;
  }
  const contents: [string, string][] = [
    [yearFileNames.document, document],
    [yearFileNames.tableHeader, tableHeader],
    [yearFileNames.tableItem, tableItem],
    [yearFileNames.tableFooter, tableFooter],
  ];
  for (const [fileName, text] of contents) {
    for (const name of findPlaceholders(text)) {
      if (!placeholderNames.has(name)) {
        read.push(warningIssue(fileName, texts.issues.unknownPlaceholder(name)));
      }
    }
  }
  return template;
}

function findPlaceholders(text: string): string[] {
  return [...text.matchAll(/\$\{([^}]*)\}/g)].map((match) => match[1] ?? "");
}

function checkAddresses(addresses: Mapped<Address>, issues: Issue[]): void {
  const firstLineById = new Map<number, number | undefined>();
  addresses.items.forEach((address, index) => {
    const line = addresses.lines[index];
    if (firstLineById.has(address.id)) {
      issues.push(errorIssue(yearFileNames.address, texts.issues.duplicateAddressId(address.id), line));
    } else {
      firstLineById.set(address.id, line);
    }
  });
}

function checkTransactions(data: YearData, transactions: Mapped<Transaction>, issues: Issue[]): void {
  const ids = new Set(data.addresses.map((address) => address.id));
  transactions.items.forEach((transaction, index) => {
    if (!ids.has(transaction.addressId)) {
      issues.push(
        warningIssue(
          yearFileNames.transaction,
          texts.issues.unknownAddressId(transaction.addressId),
          transactions.lines[index],
        ),
      );
    }
  });
}

function checkDynamicShares(data: YearData, shares: Mapped<DynamicShare>, issues: Issue[]): void {
  const ids = new Set(data.addresses.map((address) => address.id));
  const factorYears = new Set(data.conversionFactors.map((factor) => factor.year));
  const reportedYears = new Set<number>();
  shares.items.forEach((share, index) => {
    const line = shares.lines[index];
    if (!ids.has(share.addressId)) {
      issues.push(
        warningIssue(yearFileNames.dynamicShare, texts.issues.unknownAddressId(share.addressId), line),
      );
    }
    const year = share.date.year;
    if (!factorYears.has(year) && !reportedYears.has(year)) {
      reportedYears.add(year);
      issues.push(errorIssue(yearFileNames.dynamicShare, texts.errors.noConversionFactor(year), line));
    }
  });
}

function checkPowerEarnings(data: YearData, earnings: Mapped<PowerEarning>, issues: Issue[]): void {
  const matches = earnings.items
    .map((earning, index) => ({ earning, line: earnings.lines[index] }))
    .filter((entry) => entry.earning.year === data.year);
  if (matches.length === 0) {
    issues.push(errorIssue(yearFileNames.powerEarning, texts.issues.missingPowerEarning(data.year)));
  }
  if (matches.length > 1) {
    issues.push(
      errorIssue(
        yearFileNames.powerEarning,
        texts.issues.duplicatePowerEarning(data.year),
        matches[1]?.line,
      ),
    );
  }
}

function checkConversionFactors(factors: Mapped<ConversionFactor>, issues: Issue[]): void {
  const seenYears = new Set<number>();
  const reportedYears = new Set<number>();
  factors.items.forEach((factor, index) => {
    const year = factor.year;
    if (seenYears.has(year) && !reportedYears.has(year)) {
      reportedYears.add(year);
      issues.push(
        errorIssue(
          yearFileNames.conversionFactor,
          texts.errors.duplicateConversionFactor(year),
          factors.lines[index],
        ),
      );
    }
    seenYears.add(year);
  });
}

function errorIssue(file: string, message: string, line?: number): Issue {
  return { severity: "error", file, line, message };
}

function warningIssue(file: string, message: string, line?: number): Issue {
  return { severity: "warning", file, line, message };
}
