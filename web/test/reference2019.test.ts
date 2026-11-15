import { describe, expect, it } from "vitest";
import addressCsv from "../../CustomerTest/2019/Address.csv?raw";
import conversionFactorCsv from "../../CustomerTest/2019/ConversionFactor.csv?raw";
import dynamicShareCsv from "../../CustomerTest/2019/DynamicShare.csv?raw";
import powerEarningCsv from "../../CustomerTest/2019/PowerEarning.csv?raw";
import transactionCsv from "../../CustomerTest/2019/Transaction.csv?raw";
import summaryCsv from "./fixtures/CustomerTest_Summary_2019.csv?raw";
import { calculateCertificate } from "../src/logic/certificate";
import { calculateTotals } from "../src/logic/certificateCollection";
import { parseDecimal } from "../src/logic/decimal";
import type { CalendarDate } from "../src/model/types";

type Row = Record<string, string>;

const year = 2019;

function parseRows(text: string): Row[] {
  const [headerLine, ...lines] = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  const headers = splitLine(headerLine ?? "");
  return lines.map((line) => {
    const cells = splitLine(line);
    return Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""]));
  });
}

function splitLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

function field(row: Row, name: string): string {
  const value = row[name];
  if (value === undefined) {
    throw new Error(`Missing column ${name}`);
  }
  return value;
}

function parseDate(text: string): CalendarDate {
  const [day = 0, month = 0, yearPart = 0] = text.split(".").map(Number);
  return { day, month, year: yearPart < 100 ? 2000 + yearPart : yearPart };
}

const addresses = parseRows(addressCsv).map((row) => ({
  id: Number(field(row, "Id")),
  name: field(row, "Name"),
  street: field(row, "Street"),
  city: field(row, "City"),
}));

const transactions = parseRows(transactionCsv).map((row) => ({
  addressId: Number(field(row, "AddressId")),
  date: parseDate(field(row, "Date")),
  description: field(row, "Description"),
  amount: Number(field(row, "Amount")),
}));

const dynamicShares = parseRows(dynamicShareCsv).map((row) => ({
  addressId: Number(field(row, "AddressId")),
  date: parseDate(field(row, "Date")),
  powerPurchase: Number(field(row, "PowerPurchase")),
}));

const powerEarnings = parseRows(powerEarningCsv).map((row) => ({
  year: Number(field(row, "Year")),
  earning: Number(field(row, "Earning")),
}));

const conversionFactors = parseRows(conversionFactorCsv).map((row) => ({
  year: Number(field(row, "Year")),
  factor: parseDecimal(field(row, "Factor")),
}));

// The first line of the C# summary ("Year: 2019") is not part of the CSV table.
const expectedRows = parseRows(summaryCsv.split(/\r?\n/).slice(1).join("\n"));

describe("CustomerTest 2019 reference summary", () => {
  const powerEarning = powerEarnings.find((p) => p.year === year);
  if (!powerEarning) {
    throw new Error(`No power earning for ${year}`);
  }

  const certificates = addresses.map((address) =>
    calculateCertificate({
      year,
      address,
      powerEarning,
      transactions: transactions.filter((t) => t.addressId === address.id),
      dynamicShares: dynamicShares.filter((s) => s.addressId === address.id),
      conversionFactors,
    }),
  );

  it("matches the certificates of every address", () => {
    const addressRows = expectedRows.filter((row) => field(row, "Id") !== "999");
    expect(certificates).toHaveLength(addressRows.length);

    for (const row of addressRows) {
      const id = Number(field(row, "Id"));
      const certificate = certificates.find((c) => c.address.id === id);
      expect(certificate, `address ${id}`).toBeDefined();
      expect({
        id,
        held: certificate?.numberOfCertificatesHeld,
        remaining: certificate?.remainingBalance,
        committed: certificate?.numberOfCommittedCertificates,
      }).toEqual({
        id,
        held: Number(field(row, "NumberOfCertificatesHeld")),
        remaining: Number(field(row, "RemainingBalance")),
        committed: Number(field(row, "NumberOfCommittedCertificates")),
      });
    }
  });

  it("matches the totals", () => {
    const totalRow = expectedRows.find((row) => field(row, "Id") === "999");
    if (!totalRow) {
      throw new Error("No total row in the reference summary");
    }
    const totals = calculateTotals(certificates);
    expect({
      held: totals.totalNumberOfCertificates,
      remaining: totals.totalRemainingBalance,
      committed: totals.totalNumberOfCommittedCertificates,
    }).toEqual({
      held: Number(field(totalRow, "NumberOfCertificatesHeld")),
      remaining: Number(field(totalRow, "RemainingBalance")),
      committed: Number(field(totalRow, "NumberOfCommittedCertificates")),
    });
  });
});
