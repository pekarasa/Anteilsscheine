import type { Certificate } from "./certificate";

export interface CertificateTotals {
  totalNumberOfCertificates: number;
  totalNumberOfCommittedCertificates: number;
  totalRemainingBalance: number;
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
