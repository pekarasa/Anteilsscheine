export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface DecimalValue {
  /** Value exactly as written in the CSV file, e.g. "0.8" or "1.0". */
  text: string;
  /** Value multiplied by 10^scale. */
  units: bigint;
  /** Number of decimal places. */
  scale: number;
}

export interface Address {
  id: number;
  name: string;
  street: string;
  city: string;
}

export interface Transaction {
  addressId: number;
  date: CalendarDate;
  description: string;
  amount: number;
}

export interface DynamicShare {
  addressId: number;
  date: CalendarDate;
  powerPurchase: number;
}

export interface PowerEarning {
  year: number;
  earning: number;
}

export interface ConversionFactor {
  year: number;
  factor: DecimalValue;
}

export interface Settings {
  printDate: string;
  signer1: string;
  signer2: string;
}

export interface Template {
  document: string;
  tableHeader: string;
  tableItem: string;
  tableFooter: string;
  logo?: Uint8Array;
}

export interface RawRow {
  /** 1-based line in the source file. Undefined for rows added in the app. */
  line?: number;
  /** Cell texts exactly as edited, aligned with RawTable.header. */
  cells: string[];
}

export interface RawTable {
  /** Column names as found in the file, so that unknown columns survive. */
  header: string[];
  rows: RawRow[];
}

/** All data of a year as it is stored, including invalid values. */
export interface YearModel {
  year: number;
  address: RawTable;
  transaction: RawTable;
  dynamicShare: RawTable;
  powerEarning: RawTable;
  conversionFactor: RawTable;
  template: Template;
  /** Undefined if Settings.json exists but is invalid; the file is then left unchanged. */
  settings?: Settings;
}

export interface YearData {
  year: number;
  addresses: Address[];
  transactions: Transaction[];
  dynamicShares: DynamicShare[];
  powerEarnings: PowerEarning[];
  conversionFactors: ConversionFactor[];
  template: Template;
  settings: Settings;
}
