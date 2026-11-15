import { describe, expect, it } from "vitest";
import { createYear, buildSummary, saveYear } from "../src/io/yearOps";
import { readYear } from "../src/io/validation";
import { findYearFolders, getYearFile, type YearFolder } from "../src/io/zip";
import type { CalendarDate, YearData, YearModel } from "../src/model/types";
import { yearArchive } from "./helpers/archive";
import type { Archive } from "../src/io/zip";

const decoder = new TextDecoder();
const today: CalendarDate = { year: 2026, month: 11, day: 15 };

function loadYear(archive: Archive, year: number, customer = "Test") {
  const folder = findYearFolders(archive).find((f) => f.year === year && f.customer === customer);
  if (!folder) {
    throw new Error(`No folder for ${customer} ${year}`);
  }
  return { folder, result: readYear(archive, folder, today) };
}

function loadModel(archive: Archive, year: number): { folder: YearFolder; model: YearModel; data?: YearData } {
  const { folder, result } = loadYear(archive, year);
  if (!result.model) {
    throw new Error(`Year ${year} has no model`);
  }
  return { folder, model: result.model, data: result.data };
}

function loadData(archive: Archive, year: number): YearData {
  const { data } = loadModel(archive, year);
  if (!data) {
    throw new Error(`Year ${year} has no valid data`);
  }
  return data;
}

describe("buildSummary", () => {
  it("matches the format of the C# summary", () => {
    expect(buildSummary(loadData(yearArchive(), 2019))).toBe(
      [
        "Year: 2019",
        "Id, Name, Street, City, NumberOfCertificatesHeld, RemainingBalance, NumberOfCommittedCertificates",
        "101, Maya Graf, Unter der Fluh 22, 4450 Sissach, 6, 80, 6",
        "999, Total, , , 6, 80, 6",
        "",
      ].join("\n"),
    );
  });

  it("quotes names that contain a comma", () => {
    const data = loadData(yearArchive({ "Address.csv": 'Id,Name,Street,City\r\n101,"Maya, Graf",A,B\r\n' }), 2019);
    expect(buildSummary(data)).toContain('101, "Maya, Graf", A, B, 6, 80, 6');
  });
});

describe("saveYear", () => {
  it("writes data that reads back unchanged", () => {
    const archive = yearArchive();
    const { folder, model, data } = loadModel(archive, 2019);
    saveYear(archive, folder, model, data);
    expect(loadYear(archive, 2019).result.data).toEqual(data);
  });

  it("keeps an edited value and a name with comma and quotes", () => {
    const archive = yearArchive();
    const { folder, model } = loadModel(archive, 2019);
    model.address.rows[0]!.cells[1] = 'Brenzikofer, "Tobias"';
    model.transaction.rows[0]!.cells[3] = "-250";
    saveYear(archive, folder, model);
    const reread = loadData(archive, 2019);
    expect(reread.addresses[0]?.name).toBe('Brenzikofer, "Tobias"');
    expect(reread.transactions[0]?.amount).toBe(-250);
  });

  it("keeps invalid values so that nothing is lost", () => {
    const archive = yearArchive();
    const { folder, model } = loadModel(archive, 2019);
    model.transaction.rows[0]!.cells[3] = "2x0";
    saveYear(archive, folder, model);

    const result = loadYear(archive, 2019).result;
    expect(result.data).toBeUndefined();
    expect(result.model?.transaction.rows[0]?.cells[3]).toBe("2x0");
    expect(result.issues.some((issue) => issue.message.includes('"2x0"'))).toBe(true);
  });

  it("writes valid dates as dd.MM.yyyy", () => {
    const archive = yearArchive({ "Transaction.csv": "AddressId,Date,Description,Amount\r\n101,09.12.11,Kauf,200\r\n" });
    const { folder, model, data } = loadModel(archive, 2019);
    saveYear(archive, folder, model, data);
    expect(decoder.decode(getYearFile(archive, folder, "Transaction.csv"))).toBe(
      "AddressId,Date,Description,Amount\r\n101,09.12.2011,Kauf,200\r\n",
    );
  });

  it("keeps extra columns of the original file", () => {
    const archive = yearArchive({
      "Transaction.csv": "AddressId,Date,Description,Amount,Note\r\n101,09.12.2011,Kauf,200,intern\r\n",
    });
    const { folder, model, data } = loadModel(archive, 2019);
    saveYear(archive, folder, model, data);
    expect(decoder.decode(getYearFile(archive, folder, "Transaction.csv"))).toBe(
      "AddressId,Date,Description,Amount,Note\r\n101,09.12.2011,Kauf,200,intern\r\n",
    );
  });

  it("writes the CSV files with comma, UTF-8 and no BOM", () => {
    const archive = yearArchive();
    const { folder, model, data } = loadModel(archive, 2019);
    saveYear(archive, folder, model, data);
    const bytes = getYearFile(archive, folder, "Transaction.csv");
    expect(bytes?.[0]).not.toBe(0xef);
    expect(decoder.decode(bytes)).toBe(
      "AddressId,Date,Description,Amount\r\n101,09.12.2011,Kauf Anteilsscheine,200\r\n",
    );
  });

  it("writes the summary into the customer folder when the data is valid", () => {
    const archive = yearArchive();
    const { folder, model, data } = loadModel(archive, 2019);
    saveYear(archive, folder, model, data);
    expect(decoder.decode(archive.get("CustomerTest/Summary_2019.csv"))).toBe(buildSummary(data!));
  });

  it("removes an outdated summary when the data is invalid", () => {
    const archive = yearArchive();
    const { folder, model, data } = loadModel(archive, 2019);
    saveYear(archive, folder, model, data);
    model.transaction.rows[0]!.cells[3] = "x";
    saveYear(archive, folder, model);
    expect(archive.has("CustomerTest/Summary_2019.csv")).toBe(false);
  });

  it("does not overwrite an invalid Settings.json", () => {
    const broken = "{ printDate: ";
    const archive = yearArchive({ "Settings.json": broken });
    const { folder, model } = loadModel(archive, 2019);
    expect(model.settings).toBeUndefined();
    saveYear(archive, folder, model);
    expect(decoder.decode(getYearFile(archive, folder, "Settings.json"))).toBe(broken);
  });

  it("keeps unknown files and the generated folder", () => {
    const archive = yearArchive({
      "Template/notes.txt": "Notiz",
      "Generated/2019_101.pdf": new Uint8Array([37, 80, 68, 70]),
    });
    const { folder, model, data } = loadModel(archive, 2019);
    saveYear(archive, folder, model, data);
    expect(decoder.decode(archive.get("CustomerTest/2019/Template/notes.txt"))).toBe("Notiz");
    expect(archive.get("CustomerTest/2019/Generated/2019_101.pdf")).toEqual(
      new Uint8Array([37, 80, 68, 70]),
    );
  });
});

describe("createYear", () => {
  it("copies all files and sets today as print date", () => {
    const archive = yearArchive({ "Template/notes.txt": "Notiz" });
    const { folder: source } = loadYear(archive, 2019);
    const target = createYear(archive, source, 2020, today);

    expect(target).toMatchObject({ customer: "Test", year: 2020, path: "CustomerTest/2020/" });
    expect(target.fileNames.sort()).toEqual(source.fileNames.sort());
    const settings = JSON.parse(decoder.decode(getYearFile(archive, target, "Settings.json")));
    expect(settings).toEqual({ printDate: "2026-11-15", signer1: "Max Mustermann", signer2: "John Doe" });
  });

  it("leaves the source year unchanged", () => {
    const archive = yearArchive();
    const before = loadData(archive, 2019);
    const { folder: source } = loadYear(archive, 2019);
    createYear(archive, source, 2020, today);
    expect(loadData(archive, 2019)).toEqual(before);
  });

  it("does not copy generated PDFs", () => {
    const archive = yearArchive({ "Generated/2019_101.pdf": new Uint8Array([1, 2]) });
    const { folder: source } = loadYear(archive, 2019);
    const target = createYear(archive, source, 2020, today);
    expect(target.fileNames.some((name) => name.startsWith("Generated/"))).toBe(false);
  });

  it("uses default signers when the source has no settings", () => {
    const archive = yearArchive({ "Settings.json": null });
    const { folder: source } = loadYear(archive, 2019);
    const target = createYear(archive, source, 2020, today);
    const settings = JSON.parse(decoder.decode(getYearFile(archive, target, "Settings.json")));
    expect(settings).toEqual({ printDate: "2026-11-15", signer1: "", signer2: "" });
  });

  it("refuses a year that already exists", () => {
    const archive = yearArchive();
    const { folder: source } = loadYear(archive, 2019);
    expect(() => createYear(archive, source, 2019, today)).toThrow("Das Jahr 2019 existiert bereits.");
  });

  it("refuses an invalid year", () => {
    const archive = yearArchive();
    const { folder: source } = loadYear(archive, 2019);
    expect(() => createYear(archive, source, 20.5, today)).toThrow("vierstellige Zahl");
    expect(() => createYear(archive, source, 99, today)).toThrow("vierstellige Zahl");
  });

  it("creates the year in the same root folder", () => {
    const archive = yearArchive({}, "Anteilsscheine/CustomerTest/2019/");
    const { folder: source } = loadYear(archive, 2019);
    const target = createYear(archive, source, 2020, today);
    expect(target.path).toBe("Anteilsscheine/CustomerTest/2020/");
  });
});
