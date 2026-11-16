import { describe, expect, it } from "vitest";
import {
  checkYear,
  describeIssue,
  findMissingYearData,
  readYear,
  type Issue,
} from "../src/io/validation";
import { findYearFolders } from "../src/io/zip";
import type { CalendarDate } from "../src/model/types";
import { yearArchive } from "./helpers/archive";

const today: CalendarDate = { year: 2026, month: 11, day: 15 };
const encoder = new TextEncoder();

function read(overrides: Record<string, string | Uint8Array | null> = {}) {
  const archive = yearArchive(overrides);
  const [folder] = findYearFolders(archive);
  if (!folder) {
    throw new Error("No year folder in test archive");
  }
  return readYear(archive, folder, today);
}

function errors(issues: Issue[]): Issue[] {
  return issues.filter((issue) => issue.severity === "error");
}

function warnings(issues: Issue[]): Issue[] {
  return issues.filter((issue) => issue.severity === "warning");
}

describe("readYear without problems", () => {
  it("reads all tables, template and settings", () => {
    const result = read();
    expect(result.issues).toEqual([]);
    expect(result.data).toMatchObject({
      year: 2019,
      addresses: [{ id: 101, name: "Maya Graf", street: "Unter der Fluh 22", city: "4450 Sissach" }],
      transactions: [
        {
          addressId: 101,
          date: { year: 2011, month: 12, day: 9 },
          description: "Kauf Anteilsscheine",
          amount: 200,
        },
      ],
      dynamicShares: [{ addressId: 101, date: { year: 2019, month: 12, day: 31 }, powerPurchase: 600 }],
      powerEarnings: [{ year: 2019, earning: 50000 }],
      conversionFactors: [{ year: 2019, factor: { text: "0.8", units: 8n, scale: 1 } }],
      settings: { printDate: "2026-02-28", signer1: "Max Mustermann", signer2: "John Doe" },
    });
    expect(result.data?.template.document).toBe("<p>${addressName}</p>");
    expect(result.data?.template.logo).toBeUndefined();
  });

  it("keeps the logo when present", () => {
    const logo = new Uint8Array([137, 80, 78, 71]);
    const result = read({ "Template/logo.png": logo });
    expect(result.data?.template.logo).toEqual(logo);
  });
});

describe("missing files", () => {
  it("reports a missing required file and returns no data", () => {
    const result = read({ "Transaction.csv": null });
    expect(result.data).toBeUndefined();
    expect(result.issues).toEqual([
      { severity: "error", file: "Transaction.csv", message: "Die Datei Transaction.csv fehlt." },
    ]);
  });

  it("reports a missing template file", () => {
    const result = read({ "Template/TableFooter.html": null });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues).map((issue) => issue.file)).toEqual(["Template/TableFooter.html"]);
  });

  it("uses default settings with a warning when Settings.json is missing", () => {
    const result = read({ "Settings.json": null });
    expect(result.data?.settings).toEqual({ printDate: "2026-11-15", signer1: "", signer2: "" });
    expect(result.issues).toEqual([
      expect.objectContaining({ severity: "warning", file: "Settings.json" }),
    ]);
  });
});

describe("invalid values", () => {
  it("reports a missing column", () => {
    const result = read({ "Transaction.csv": "AddressId,Date,Description\r\n101,09.12.2011,X\r\n" });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "Transaction.csv", message: "Spalte(n) fehlen: Amount." }),
    ]);
  });

  it("reports an invalid integer with file and line", () => {
    const result = read({
      "Transaction.csv": "AddressId,Date,Description,Amount\r\n101,09.12.2011,A,200\r\n101,09.12.2011,B,2x0\r\n",
    });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "Transaction.csv", line: 3, message: 'Ungültige Ganzzahl in Spalte Amount: "2x0".' }),
    ]);
  });

  it("keeps the stored cells of an invalid table in the model", () => {
    const result = read({ "Transaction.csv": "AddressId,Date,Description,Amount\r\n101,09.12.2011,B,2x0\r\n" });
    expect(result.data).toBeUndefined();
    expect(result.model?.transaction.rows).toEqual([
      { line: 2, cells: ["101", "09.12.2011", "B", "2x0"] },
    ]);
  });

  it("reports an invalid date", () => {
    const result = read({ "DynamicShare.csv": "AddressId,Date,PowerPurchase\r\n101,31.02.2019,600\r\n" });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "DynamicShare.csv", line: 2, message: expect.stringContaining("31.02.2019") }),
    ]);
  });

  it("reports an invalid conversion factor", () => {
    const result = read({ "ConversionFactor.csv": "Year,Factor\r\n2019,abc\r\n" });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "ConversionFactor.csv", line: 2, message: expect.stringContaining("abc") }),
    ]);
  });

  it("reports invalid JSON in Settings.json", () => {
    const result = read({ "Settings.json": "{ printDate: " });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "Settings.json", message: "Die Datei ist kein gültiges JSON." }),
    ]);
  });

  it("reports an invalid printDate in Settings.json", () => {
    const result = read({ "Settings.json": '{"printDate":"28.02.2026"}' });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "Settings.json", message: 'Ungültiger Wert für "printDate".' }),
    ]);
  });

  it("reports a CSV line that cannot be read", () => {
    const result = read({ "Address.csv": 'Id,Name,Street,City\r\n101,"Maya Graf,Unter der Fluh 22,4450\r\n' });
    expect(result.data).toBeUndefined();
    expect(errors(result.issues)[0]).toMatchObject({ file: "Address.csv" });
  });
});

describe("semantic checks", () => {
  it("reports duplicate address IDs and keeps the data", () => {
    const result = read({
      "Address.csv": "Id,Name,Street,City\r\n101,Maya,A,B\r\n101,Other,C,D\r\n",
    });
    expect(result.data?.addresses).toHaveLength(2);
    expect(errors(result.issues)).toEqual([
      { severity: "error", file: "Address.csv", line: 3, message: "Die Adress-ID 101 kommt mehrfach vor." },
    ]);
  });

  it("warns about transactions of unknown addresses", () => {
    const result = read({
      "Transaction.csv": "AddressId,Date,Description,Amount\r\n999,09.12.2011,X,200\r\n",
    });
    expect(errors(result.issues)).toEqual([]);
    expect(warnings(result.issues)).toEqual([
      expect.objectContaining({ file: "Transaction.csv", line: 2, message: expect.stringContaining("999") }),
    ]);
  });

  it("reports a missing power earning for the year", () => {
    const result = read({ "PowerEarning.csv": "Year,Earning\r\n2018,50000\r\n" });
    expect(result.data).toBeDefined();
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "PowerEarning.csv", message: "Kein Ertrag für das Jahr 2019 in PowerEarning.csv gefunden." }),
    ]);
  });

  it("reports more than one power earning for the year", () => {
    const result = read({ "PowerEarning.csv": "Year,Earning\r\n2019,50000\r\n2019,1\r\n" });
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "PowerEarning.csv", line: 3 }),
    ]);
  });

  it("reports a dynamic share without conversion factor", () => {
    const result = read({
      "DynamicShare.csv": "AddressId,Date,PowerPurchase\r\n101,31.12.2019,600\r\n101,31.12.2020,700\r\n",
    });
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "DynamicShare.csv", line: 3, message: "Kein passender Umwandlungsfaktor für das Jahr 2020 gefunden." }),
    ]);
  });

  it("reports duplicate conversion factors", () => {
    const result = read({ "ConversionFactor.csv": "Year,Factor\r\n2019,0.8\r\n2019,1.0\r\n" });
    expect(errors(result.issues)).toEqual([
      expect.objectContaining({ file: "ConversionFactor.csv", line: 3 }),
    ]);
  });

  it("warns about unknown placeholders in the template", () => {
    const result = read({ "Template/Document.html": "<p>${addressName} ${addressNam}</p>" });
    expect(result.data).toBeDefined();
    expect(warnings(result.issues)).toEqual([
      { severity: "warning", file: "Template/Document.html", message: "Unbekannter Platzhalter: ${addressNam}." },
    ]);
  });

  it("warns once about a template in Windows-1252", () => {
    const windows1252 = new Uint8Array([...encoder.encode("<p>M"), 0xf6, ...encoder.encode("nch ${addressName}</p>")]);
    const result = read({ "Template/Document.html": windows1252 });
    expect(result.data?.template.document).toBe("<p>Mönch ${addressName}</p>");
    expect(warnings(result.issues)).toEqual([
      expect.objectContaining({ file: "Template/Document.html", message: expect.stringContaining("Windows-1252") }),
    ]);
  });
});

describe("checkYear", () => {
  it("computes the data again after a change of the model", () => {
    const result = read();
    const model = result.model!;
    const changed = {
      ...model,
      transaction: {
        ...model.transaction,
        rows: [{ line: 2, cells: ["101", "09.12.2011", "Kauf", "abc"] }],
      },
    };
    const checked = checkYear(changed, result.fileIssues);
    expect(checked.data).toBeUndefined();
    expect(errors(checked.issues)[0]?.file).toBe("Transaction.csv");
  });

  it("becomes valid again when the value is corrected", () => {
    const model = read().model!;
    const changed = {
      ...model,
      transaction: { ...model.transaction, rows: [{ line: 2, cells: ["101", "09.12.2011", "Kauf", "300"] }] },
    };
    expect(checkYear(changed, []).data?.transactions[0]?.amount).toBe(300);
  });

  it("keeps the issues about the files as read", () => {
    const model = read().model!;
    const fileIssue: Issue = { severity: "warning", file: "Address.csv", message: "Kodierung." };
    const checked = checkYear(model, [fileIssue]);
    expect(checked.issues[0]).toBe(fileIssue);
    expect(checked.fileIssues).toEqual([fileIssue]);
  });

  it("keeps the data undefined while a file issue is an error", () => {
    const model = read().model!;
    const fileIssue: Issue = { severity: "error", file: "Address.csv", message: "Fehler." };
    expect(checkYear(model, [fileIssue]).data).toBeUndefined();
  });
});

describe("findMissingYearData", () => {
  it("finds nothing in a complete year", () => {
    const model = read().model!;
    expect(findMissingYearData(model)).toEqual({ powerEarning: false, conversionFactorYears: [] });
  });

  it("finds a missing power earning of the year", () => {
    const model = read({ "PowerEarning.csv": "Year,Earning\r\n2018,1000\r\n" }).model!;
    expect(findMissingYearData(model).powerEarning).toBe(true);
  });

  it("finds years of dynamic shares without a conversion factor, once and sorted", () => {
    const model = read({
      "DynamicShare.csv": "AddressId,Date,PowerPurchase\r\n101,31.12.2021,600\r\n101,31.12.2020,300\r\n101,31.12.2020,5\r\n",
    }).model!;
    expect(findMissingYearData(model).conversionFactorYears).toEqual([2020, 2021]);
  });
});

describe("describeIssue", () => {
  it("names the file and the line", () => {
    expect(describeIssue({ severity: "error", file: "Address.csv", line: 3, message: "Fehler." })).toBe(
      "Address.csv, Zeile 3: Fehler.",
    );
  });

  it("names only the file when there is no line", () => {
    expect(describeIssue({ severity: "warning", file: "Settings.json", message: "Hinweis." })).toBe(
      "Settings.json: Hinweis.",
    );
  });
});
