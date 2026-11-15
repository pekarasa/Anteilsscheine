import { describe, expect, it } from "vitest";
import addressCsv from "../../CustomerTest/2019/Address.csv?raw";
import conversionFactorCsv from "../../CustomerTest/2019/ConversionFactor.csv?raw";
import dynamicShareCsv from "../../CustomerTest/2019/DynamicShare.csv?raw";
import powerEarningCsv from "../../CustomerTest/2019/PowerEarning.csv?raw";
import transactionCsv from "../../CustomerTest/2019/Transaction.csv?raw";
import documentHtml from "../../CustomerTest/2019/Template/Document.html?raw";
import tableFooterHtml from "../../CustomerTest/2019/Template/TableFooter.html?raw";
import tableHeaderHtml from "../../CustomerTest/2019/Template/TableHeader.html?raw";
import tableItemHtml from "../../CustomerTest/2019/Template/TableItem.html?raw";
import logoDataUrl from "../../CustomerTest/2019/Template/logo.png?inline";
import summaryCsv from "./fixtures/CustomerTest_Summary_2019.csv?raw";
import { readArchive, writeArchive, findYearFolders, type Archive } from "../src/io/zip";
import { readYear } from "../src/io/validation";
import { buildSummary, saveYear } from "../src/io/yearOps";
import type { CalendarDate } from "../src/model/types";

const encoder = new TextEncoder();
const today: CalendarDate = { year: 2026, month: 11, day: 15 };

function decodeDataUrl(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

/** The CustomerTest/2019 folder as it would be in a ZIP file, with a root folder. */
const customerTestArchive: Archive = new Map();
const customerTestFiles: Record<string, string> = {
  "Address.csv": addressCsv,
  "Transaction.csv": transactionCsv,
  "DynamicShare.csv": dynamicShareCsv,
  "PowerEarning.csv": powerEarningCsv,
  "ConversionFactor.csv": conversionFactorCsv,
  "Template/Document.html": documentHtml,
  "Template/TableHeader.html": tableHeaderHtml,
  "Template/TableItem.html": tableItemHtml,
  "Template/TableFooter.html": tableFooterHtml,
};
for (const [name, text] of Object.entries(customerTestFiles)) {
  customerTestArchive.set(`Anteilsscheine/CustomerTest/2019/${name}`, encoder.encode(text));
}
customerTestArchive.set(
  "Anteilsscheine/CustomerTest/2019/Template/logo.png",
  decodeDataUrl(logoDataUrl),
);

function loadFirstYear(archive: Archive) {
  const [folder] = findYearFolders(archive);
  if (!folder) {
    throw new Error("No year folder in the archive");
  }
  return { folder, result: readYear(archive, folder, today) };
}

const expectedSummary = summaryCsv.replace(/\r\n/g, "\n").trimEnd();

describe("CustomerTest 2019 reference summary", () => {
  it("reads the ZIP without errors", async () => {
    const archive = await readArchive(await writeArchive(customerTestArchive));
    const { result } = loadFirstYear(archive);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(result.data).toBeDefined();
  });

  it("produces the same summary as the C# program", async () => {
    const archive = await readArchive(await writeArchive(customerTestArchive));
    const { result } = loadFirstYear(archive);
    expect(result.data).toBeDefined();
    expect(buildSummary(result.data!).trimEnd()).toBe(expectedSummary);
  });

  it("keeps the same summary after saving and re-reading the ZIP", async () => {
    const archive = await readArchive(await writeArchive(customerTestArchive));
    const { folder, result } = loadFirstYear(archive);
    expect(result.data).toBeDefined();
    saveYear(archive, folder, result.data!);
    const restored = await readArchive(await writeArchive(archive));
    const reread = loadFirstYear(restored).result;
    expect(reread.data).toEqual(result.data);
    expect(buildSummary(reread.data!).trimEnd()).toBe(expectedSummary);
  });
});
