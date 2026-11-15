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
