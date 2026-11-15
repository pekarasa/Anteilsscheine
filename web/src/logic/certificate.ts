import type {
  Address,
  CalendarDate,
  ConversionFactor,
  DecimalValue,
  DynamicShare,
  PowerEarning,
  Transaction,
} from "../model/types";
import { multiplyTruncated } from "./decimal";
import { texts } from "../ui/texts";

export interface CertificateInput {
  year: number;
  address: Address;
  powerEarning: PowerEarning;
  transactions: Transaction[];
  dynamicShares: DynamicShare[];
  conversionFactors: ConversionFactor[];
}

export interface Certificate {
  address: Address;
  powerEarning: number;
  numberOfCertificatesHeld: number;
  numberOfCommittedCertificates: number;
  remainingBalance: number;
  transactionsUpToYear: Transaction[];
}

export function calculateCertificate(input: CertificateInput): Certificate {
  const { year } = input;
  const dynamicTransactions = input.dynamicShares.map((share) =>
    toDynamicTransaction(share, input.conversionFactors),
  );

  const fixUpToYear = input.transactions.filter((t) => t.date.year <= year);
  const dynamicUpToYear = dynamicTransactions.filter((t) => t.date.year <= year);

  const fixSum = sumAmounts(fixUpToYear);
  const numberOfCommittedCertificates = Math.trunc(
    (fixSum + sumAmounts(dynamicTransactions)) / 100,
  );

  const amountHeld = fixSum + sumAmounts(dynamicUpToYear);
  const numberOfCertificatesHeld = Math.trunc(amountHeld / 100);

  return {
    address: input.address,
    powerEarning: input.powerEarning.earning,
    numberOfCertificatesHeld,
    numberOfCommittedCertificates,
    remainingBalance: amountHeld - numberOfCertificatesHeld * 100,
    transactionsUpToYear: [...fixUpToYear, ...dynamicUpToYear].sort((a, b) =>
      compareDates(a.date, b.date),
    ),
  };
}

/**
 * Personal share of the power earning. The integer division happens first,
 * exactly like in the C# implementation.
 */
export function calculatePersonalPowerEarning(
  certificate: Certificate,
  totalNumberOfCommittedCertificates: number,
): number {
  if (totalNumberOfCommittedCertificates === 0) {
    throw new Error(texts.errors.noCommittedCertificates);
  }
  return Math.trunc(
    Math.trunc(certificate.powerEarning / totalNumberOfCommittedCertificates) *
      certificate.numberOfCommittedCertificates,
  );
}

function toDynamicTransaction(
  share: DynamicShare,
  conversionFactors: ConversionFactor[],
): Transaction {
  const year = share.date.year;
  const factor = findConversionFactor(conversionFactors, year);
  return {
    addressId: share.addressId,
    date: share.date,
    description: `Jährlicher Strombezug ${year}: ${share.powerPurchase}.- x ${factor.text} =`,
    amount: multiplyTruncated(share.powerPurchase, factor),
  };
}

function findConversionFactor(
  conversionFactors: ConversionFactor[],
  year: number,
): DecimalValue {
  const matches = conversionFactors.filter((cf) => cf.year === year);
  const [first] = matches;
  if (!first) {
    throw new Error(texts.errors.noConversionFactor(year));
  }
  if (matches.length > 1) {
    throw new Error(texts.errors.duplicateConversionFactor(year));
  }
  return first.factor;
}

function sumAmounts(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
