import { describe, expect, it } from "vitest";
import type { Certificate } from "../src/logic/certificate";
import { calculatePersonalPowerEarning } from "../src/logic/certificate";
import { calculateTotals } from "../src/logic/certificateCollection";

function certificate(
  numberOfCertificatesHeld: number,
  numberOfCommittedCertificates: number,
  remainingBalance: number,
): Certificate {
  return {
    address: { id: 1, name: "Test Person", street: "Musterweg 1", city: "4000 Basel" },
    powerEarning: 1000,
    numberOfCertificatesHeld,
    numberOfCommittedCertificates,
    remainingBalance,
    transactionsUpToYear: [],
  };
}

describe("calculateTotals", () => {
  it("returns zero totals for an empty collection", () => {
    expect(calculateTotals([])).toEqual({
      totalNumberOfCertificates: 0,
      totalNumberOfCommittedCertificates: 0,
      totalRemainingBalance: 0,
    });
  });

  it("sums all certificates", () => {
    const totals = calculateTotals([certificate(2, 5, 3), certificate(1, 5, 1)]);
    expect(totals).toEqual({
      totalNumberOfCertificates: 3,
      totalNumberOfCommittedCertificates: 10,
      totalRemainingBalance: 4,
    });
  });

  it("uses the totals for the personal power earning of each certificate", () => {
    const certificates = [certificate(2, 5, 3), certificate(1, 5, 1)];
    const totals = calculateTotals(certificates);
    expect(
      calculatePersonalPowerEarning(certificates[0]!, totals.totalNumberOfCommittedCertificates),
    ).toBe(500);
  });
});
