import { describe, expect, it } from "vitest";
import {
  calculateCertificate,
  calculatePersonalPowerEarning,
  type CertificateInput,
} from "../src/logic/certificate";
import { parseDecimal } from "../src/logic/decimal";
import type {
  CalendarDate,
  ConversionFactor,
  DynamicShare,
  Transaction,
} from "../src/model/types";

const address = { id: 1, name: "Test Person", street: "Musterweg 1", city: "4000 Basel" };
const powerEarning = { year: 2018, earning: 1000 };

function date(year: number, month = 12, day = 31): CalendarDate {
  return { year, month, day };
}

function transaction(year: number, amount: number, month = 2, day = 15): Transaction {
  return { addressId: 1, date: date(year, month, day), description: "Test", amount };
}

function dynamicShare(year: number, powerPurchase: number): DynamicShare {
  return { addressId: 1, date: date(year), powerPurchase };
}

function factor(year: number, text = "1.0"): ConversionFactor {
  return { year, factor: parseDecimal(text) };
}

function input(overrides: Partial<CertificateInput>): CertificateInput {
  return {
    year: 2018,
    address,
    powerEarning,
    transactions: [],
    dynamicShares: [],
    conversionFactors: [],
    ...overrides,
  };
}

describe("calculateCertificate", () => {
  it("counts dynamic and fixed certificates as committed", () => {
    const dynamicShares: DynamicShare[] = [];
    const conversionFactors: ConversionFactor[] = [];
    for (let year = 2010; year <= 2019; year++) {
      dynamicShares.push(dynamicShare(year, 200));
      conversionFactors.push(factor(year));
    }
    const result = calculateCertificate(
      input({
        year: 2018,
        transactions: [transaction(2012, 1500)],
        dynamicShares,
        conversionFactors,
      }),
    );
    expect(result.numberOfCommittedCertificates).toBe(35);
  });

  it("calculates the personal power earning for a quarter of the certificates", () => {
    const result = calculateCertificate(
      input({ transactions: [transaction(2012, 2500)] }),
    );
    expect(calculatePersonalPowerEarning(result, 100)).toBe(250);
  });

  it("ignores dynamic shares and transactions after the year for the held certificates", () => {
    const dynamicShares: DynamicShare[] = [];
    const conversionFactors: ConversionFactor[] = [];
    for (let year = 2010; year <= 2019; year++) {
      dynamicShares.push(dynamicShare(year, 100));
      conversionFactors.push(factor(year));
    }
    const result = calculateCertificate(
      input({
        year: 2015,
        transactions: [transaction(2012, 1500), transaction(2016, 2500)],
        dynamicShares,
        conversionFactors,
      }),
    );

    expect(result.numberOfCertificatesHeld).toBe(21);
    expect(result.remainingBalance).toBe(0);
    expect(result.transactionsUpToYear.map((t) => t.date.year)).toEqual([
      2010, 2011, 2012, 2012, 2013, 2014, 2015,
    ]);
  });

  it("returns the remaining balance below one certificate", () => {
    const result = calculateCertificate(input({ transactions: [transaction(2012, 1550)] }));
    expect(result.numberOfCertificatesHeld).toBe(15);
    expect(result.remainingBalance).toBe(50);
  });

  it("converts dynamic shares with the factor of their year and describes them", () => {
    const result = calculateCertificate(
      input({
        year: 2019,
        dynamicShares: [dynamicShare(2019, 100)],
        conversionFactors: [factor(2019, "0.29")],
      }),
    );
    expect(result.numberOfCommittedCertificates).toBe(0);
    expect(result.transactionsUpToYear).toEqual([
      {
        addressId: 1,
        date: date(2019),
        description: "Jährlicher Strombezug 2019: 100.- x 0.29 =",
        amount: 29,
      },
    ]);
  });

  it("truncates converted amounts instead of rounding them", () => {
    const result = calculateCertificate(
      input({
        year: 2019,
        dynamicShares: [dynamicShare(2019, 650)],
        conversionFactors: [factor(2019, "0.9")],
      }),
    );
    expect(result.transactionsUpToYear[0]?.amount).toBe(585);
  });

  it("truncates negative totals towards zero like C#", () => {
    const result = calculateCertificate(input({ transactions: [transaction(2012, -150)] }));
    expect(result.numberOfCertificatesHeld).toBe(-1);
    expect(result.remainingBalance).toBe(-50);
    expect(result.numberOfCommittedCertificates).toBe(-1);
  });

  it("sorts the transactions for the document by date", () => {
    const result = calculateCertificate(
      input({
        year: 2019,
        transactions: [transaction(2015, 100, 5, 1), transaction(2011, 200, 3, 1)],
        dynamicShares: [dynamicShare(2012, 100)],
        conversionFactors: [factor(2012)],
      }),
    );
    expect(result.transactionsUpToYear.map((t) => t.date)).toEqual([
      date(2011, 3, 1),
      date(2012),
      date(2015, 5, 1),
    ]);
  });

  it("fails with a German message when a conversion factor is missing", () => {
    expect(() =>
      calculateCertificate(
        input({ year: 2019, dynamicShares: [dynamicShare(2019, 100)] }),
      ),
    ).toThrow("Kein passender Umwandlungsfaktor für das Jahr 2019 gefunden.");
  });

  it("fails when a conversion factor exists more than once", () => {
    expect(() =>
      calculateCertificate(
        input({
          year: 2019,
          dynamicShares: [dynamicShare(2019, 100)],
          conversionFactors: [factor(2019), factor(2019, "0.9")],
        }),
      ),
    ).toThrow("Mehrere Umwandlungsfaktoren für das Jahr 2019 gefunden.");
  });
});

describe("calculatePersonalPowerEarning", () => {
  const certificate = calculateCertificate(
    input({ transactions: [transaction(2012, 2500)], powerEarning: { year: 2018, earning: 1000 } }),
  );

  it("divides before multiplying, like the C# code", () => {
    expect(calculatePersonalPowerEarning(certificate, 100)).toBe(250);
    expect(calculatePersonalPowerEarning(certificate, 30)).toBe(825);
    expect(calculatePersonalPowerEarning(certificate, 3)).toBe(8325);
  });

  it("fails with a German message when no certificate is committed", () => {
    expect(() => calculatePersonalPowerEarning(certificate, 0)).toThrow(
      "Es gibt keine Anteilsscheine mit Strombezug.",
    );
  });
});
