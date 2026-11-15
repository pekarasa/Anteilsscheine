import type { YearData } from "../model/types";
import { calculateCertificate, type Certificate } from "./certificate";
import { texts } from "../ui/texts";

export interface CertificateTotals {
  totalNumberOfCertificates: number;
  totalNumberOfCommittedCertificates: number;
  totalRemainingBalance: number;
}

/** One certificate per address, in the order of the address list. */
export function calculateYearCertificates(data: YearData): Certificate[] {
  const powerEarning = data.powerEarnings.find((earning) => earning.year === data.year);
  if (!powerEarning) {
    throw new Error(texts.issues.missingPowerEarning(data.year));
  }
  return data.addresses.map((address) =>
    calculateCertificate({
      year: data.year,
      address,
      powerEarning,
      transactions: data.transactions.filter((t) => t.addressId === address.id),
      dynamicShares: data.dynamicShares.filter((s) => s.addressId === address.id),
      conversionFactors: data.conversionFactors,
    }),
  );
}

/**
 * Sums over all addresses, independent of any filter applied to the document.
 */
export function calculateTotals(certificates: readonly Certificate[]): CertificateTotals {
  return {
    totalNumberOfCertificates: sum(certificates, (c) => c.numberOfCertificatesHeld),
    totalNumberOfCommittedCertificates: sum(certificates, (c) => c.numberOfCommittedCertificates),
    totalRemainingBalance: sum(certificates, (c) => c.remainingBalance),
  };
}

function sum(certificates: readonly Certificate[], value: (c: Certificate) => number): number {
  return certificates.reduce((total, c) => total + value(c), 0);
}
