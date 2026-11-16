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
import { buildLetterPreview, buildPrintDocument, selectCertificates } from "../src/template/printDocument";
import { calculateCertificate } from "../src/logic/certificate";
import { readYear } from "../src/io/validation";
import { findYearFolders, type Archive } from "../src/io/zip";
import type {
  Address,
  CalendarDate,
  ConversionFactor,
  DynamicShare,
  Template,
  Transaction,
  YearData,
} from "../src/model/types";
import { parseDecimal } from "../src/logic/decimal";
import { texts } from "../src/ui/texts";

const encoder = new TextEncoder();
const today: CalendarDate = { year: 2026, month: 11, day: 15 };
const allFilter = { nameFilter: "", includeWithoutCertificates: true };
const defaultFilter = { nameFilter: "", includeWithoutCertificates: false };

function letters(html: string): string[] {
  return html.split('<div class="letter').slice(1);
}

function date(year: number, month = 12, day = 31): CalendarDate {
  return { year, month, day };
}

function template(document: string): Template {
  return {
    document,
    tableHeader: "<table>",
    tableItem: "<tr><td>${Date}</td><td>${Description}</td><td>${Amount}</td></tr>",
    tableFooter: "<tr><td>${Date}</td><td>Total</td><td>${Amount}</td></tr></table>",
  };
}

const simpleDocument =
  "<html><head><style>p { color: red }</style></head><body>" +
  "<p>${addressName}</p><p class=\"pagebreak\">${personalNumberOfShareCertificate}</p>" +
  "${transactionTable}</body></html>";

function person(id: number, name: string): Address {
  return { id, name, street: "Weg 1", city: "4000 Basel" };
}

function yearData(overrides: Partial<YearData> = {}): YearData {
  return {
    year: 2015,
    addresses: [person(1, "Anna Muster"), person(2, "Bruno Beispiel")],
    transactions: [{ addressId: 1, date: date(2012), description: "Kauf", amount: 200 }],
    dynamicShares: [],
    powerEarnings: [{ year: 2015, earning: 1000 }],
    conversionFactors: [],
    template: template(simpleDocument),
    settings: { printDate: "2026-02-28", signer1: "Max Mustermann", signer2: "John Doe" },
    ...overrides,
  };
}

describe("selectCertificates", () => {
  const certificates = [
    calculateCertificate({
      year: 2015,
      address: person(1, "Maya Graf"),
      powerEarning: { year: 2015, earning: 1000 },
      transactions: [{ addressId: 1, date: date(2012), description: "x", amount: 200 }],
      dynamicShares: [],
      conversionFactors: [],
    }),
    calculateCertificate({
      year: 2015,
      address: person(2, "Anton Lauber"),
      powerEarning: { year: 2015, earning: 1000 },
      transactions: [],
      dynamicShares: [],
      conversionFactors: [],
    }),
  ];

  it("leaves out addresses without committed certificates by default", () => {
    const names = selectCertificates(certificates, defaultFilter).map((c) => c.address.name);
    expect(names).toEqual(["Maya Graf"]);
  });

  it("includes all addresses when requested", () => {
    expect(selectCertificates(certificates, allFilter)).toHaveLength(2);
  });

  it("matches the name filter case-sensitively", () => {
    const filter = { nameFilter: "graf", includeWithoutCertificates: true };
    expect(selectCertificates(certificates, filter)).toEqual([]);
    const exact = { nameFilter: "Graf", includeWithoutCertificates: true };
    expect(selectCertificates(certificates, exact).map((c) => c.address.name)).toEqual([
      "Maya Graf",
    ]);
  });
});

describe("buildPrintDocument", () => {
  it("creates a standalone HTML document with the styles of the template", () => {
    const html = buildPrintDocument(yearData(), allFilter);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<html lang="de-CH">');
    expect(html).toContain("<style>p { color: red }</style>");
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    expect(html).not.toMatch(/\$\{\w+\}/);
  });

  it("starts every letter after the first on a new page", () => {
    const html = buildPrintDocument(yearData(), allFilter);
    const parts = letters(html);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("Anna Muster");
    expect(parts[0]).not.toContain("letter-break");
    expect(parts[1]).toContain("letter-break");
    expect(parts[1]).toContain("Bruno Beispiel");
  });

  it("applies the name filter and the committed filter", () => {
    const withoutCommitted = buildPrintDocument(yearData(), defaultFilter);
    expect(letters(withoutCommitted)).toHaveLength(1);
    expect(withoutCommitted).toContain("Anna Muster");
    expect(withoutCommitted).not.toContain("Bruno Beispiel");
    const filtered = buildPrintDocument(yearData(), {
      nameFilter: "Bruno",
      includeWithoutCertificates: true,
    });
    expect(letters(filtered)).toHaveLength(1);
    expect(filtered).toContain("Bruno Beispiel");
    expect(filtered).not.toContain("Anna Muster");
  });

  it("only shows transactions up to the year, as in the C# tool", () => {
    const dynamicShares: DynamicShare[] = [];
    const conversionFactors: ConversionFactor[] = [];
    for (let year = 2010; year <= 2019; year++) {
      dynamicShares.push({ addressId: 1, date: date(year), powerPurchase: 100 });
      conversionFactors.push({ year, factor: parseDecimal("1.0") });
    }
    const transactions: Transaction[] = [
      { addressId: 1, date: date(2012), description: "Kauf", amount: 1500 },
      { addressId: 1, date: date(2016), description: "Kauf", amount: 2500 },
    ];
    const html = buildPrintDocument(
      yearData({
        addresses: [person(1, "Anna Muster")],
        transactions,
        dynamicShares,
        conversionFactors,
        template: template(simpleDocument),
      }),
      allFilter,
    );
    expect(html).toContain('pagebreak">21</p>');
    expect(html).toContain("31.12.2015</td><td>Total</td>");
    expect(html).not.toContain("31.12.2016");
    expect(html).not.toContain("31.12.2019");
  });

  it("replaces the logo reference by a data URL", () => {
    const logo = Uint8Array.from([137, 80, 78, 71]);
    const html = buildPrintDocument(
      yearData({
        addresses: [person(1, "Anna Muster")],
        template: {
          ...template('<body><img src="logo.png" alt="" /><p>${addressName}</p></body>'),
          logo,
        },
      }),
      allFilter,
    );
    expect(html).toContain('<img src="data:image/png;base64,iVBORw==" alt="" />');
    expect(html).not.toContain('src="logo.png"');
  });

  it("keeps the logo reference if there is no logo", () => {
    const html = buildPrintDocument(
      yearData({
        addresses: [person(1, "Anna Muster")],
        template: template('<body><img src="logo.png" /></body>'),
      }),
      allFilter,
    );
    expect(html).toContain('<img src="logo.png" />');
  });

  it("fails with a German message if the power earning is missing", () => {
    expect(() => buildPrintDocument(yearData({ powerEarnings: [] }), allFilter)).toThrow(
      texts.issues.missingPowerEarning(2015),
    );
  });

  it("fails with a German message if no certificate is committed", () => {
    expect(() =>
      buildPrintDocument(yearData({ transactions: [] }), allFilter),
    ).toThrow(texts.errors.noCommittedCertificates);
  });

  it("fails if the template has no body", () => {
    const data = yearData({
      addresses: [person(1, "Anna Muster")],
      transactions: [{ addressId: 1, date: date(2012), description: "Kauf", amount: 100 }],
      template: template("<p>ohne Body</p>"),
    });
    expect(() => buildPrintDocument(data, allFilter)).toThrow(texts.errors.templateWithoutBody);
  });
});

describe("buildLetterPreview", () => {
  it("shows only the letter of the chosen address, also without committed certificates", () => {
    const data = yearData({ transactions: [{ addressId: 1, date: date(2012), description: "Kauf", amount: 200 }] });
    const html = buildLetterPreview(data, 2);
    expect(letters(html)).toHaveLength(1);
    expect(html).toContain("<style>p { color: red }</style>");
    expect(html).not.toContain("Anna Muster");
    expect(html).toContain("Bruno Beispiel");
    expect(html).not.toContain('class="letter letter-break"');
  });

  it("fills the figures of the chosen address", () => {
    const data = yearData({ transactions: [{ addressId: 1, date: date(2012), description: "Kauf", amount: 200 }] });
    expect(buildLetterPreview(data, 1)).toContain('pagebreak">2</p>');
  });
});

describe("CustomerTest 2019 letters", () => {
  const archive: Archive = new Map();
  const files: Record<string, string> = {
    "Address.csv": addressCsv,
    "Transaction.csv": transactionCsv,
    "DynamicShare.csv": dynamicShareCsv,
    "PowerEarning.csv": powerEarningCsv,
    "ConversionFactor.csv": conversionFactorCsv,
    "Settings.json": '{"printDate":"2026-02-28","signer1":"Max Mustermann","signer2":"John Doe"}',
    "Template/Document.html": documentHtml,
    "Template/TableHeader.html": tableHeaderHtml,
    "Template/TableItem.html": tableItemHtml,
    "Template/TableFooter.html": tableFooterHtml,
  };
  for (const [name, text] of Object.entries(files)) {
    archive.set(`CustomerTest/2019/${name}`, encoder.encode(text));
  }
  const [folder] = findYearFolders(archive);
  const result = readYear(archive, folder!, today);
  const data = result.data!;

  it("has data without errors", () => {
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("creates one letter per address with committed certificates", () => {
    const html = buildPrintDocument(data, defaultFilter);
    expect(letters(html)).toHaveLength(8);
  });

  it("fills the figures of the summary of the C# tool", () => {
    const html = buildPrintDocument(data, defaultFilter);
    const maya = letters(html).find((letter) => letter.includes("Maya Graf"));
    expect(maya).toBeDefined();
    expect(maya).toContain("&#36;{year}: 2019");
    expect(maya).toContain("&#36;{plantPowerEarning}: 129900");
    expect(maya).toContain("&#36;{totalNumberOfShareCertificate}: 328");
    expect(maya).toContain("&#36;{personalNumberOfShareCertificate}: 44");
    expect(maya).toContain("&#36;{personalPowerEarning}: 20384");
    expect(maya).toContain("&#36;{personalRemainingBalance}: 19");
  });

  it("fills the print date and the signers from the settings", () => {
    const html = buildPrintDocument(data, defaultFilter);
    const maya = letters(html).find((letter) => letter.includes("Maya Graf"));
    expect(maya).toContain("print date: 28. Februar 2026");
    expect(maya).toContain("signer1: Max Mustermann");
    expect(maya).toContain("signer2: John Doe");
  });

  it("shows the transaction table of the letter", () => {
    const html = buildPrintDocument(data, defaultFilter);
    const maya = letters(html).find((letter) => letter.includes("Maya Graf"));
    expect(maya).toContain(">09.12.2011</p>");
    expect(maya).toContain(">31.12.2019</p>");
    expect(maya).toContain(">Total</p>");
  });
});
