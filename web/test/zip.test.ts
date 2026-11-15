import { describe, expect, it } from "vitest";
import {
  exportFileName,
  findYearFolders,
  getYearFile,
  readArchive,
  writeArchive,
  type Archive,
} from "../src/io/zip";

const encoder = new TextEncoder();

function archiveOf(files: Record<string, string>): Archive {
  return new Map(Object.entries(files).map(([path, text]) => [path, encoder.encode(text)]));
}

const sample = archiveOf({
  "CustomerTest/2019/Address.csv": "Id,Name\r\n101,Maya Graf\r\n",
  "CustomerTest/2019/Template/Document.html": "<html></html>",
  "CustomerTest/2019/Template/logo.png": "\u0089PNG-bytes",
  "CustomerTest/2018/Address.csv": "Id,Name\r\n",
  "CustomerTest/Summary_2019.csv": "Year: 2019\r\n",
  "CustomerAnna/2019/Address.csv": "Id,Name\r\n",
});

describe("writeArchive and readArchive", () => {
  it("round-trips all files without data loss", async () => {
    const bytes = await writeArchive(sample);
    const restored = await readArchive(bytes);
    expect([...restored.keys()].sort()).toEqual([...sample.keys()].sort());
    for (const [path, data] of sample) {
      expect(restored.get(path), path).toEqual(data);
    }
  });

  it("keeps binary content unchanged", async () => {
    const bytes = await writeArchive(new Map([["a.bin", new Uint8Array([0, 255, 128, 10])]]));
    const restored = await readArchive(bytes);
    expect(restored.get("a.bin")).toEqual(new Uint8Array([0, 255, 128, 10]));
  });
});

describe("findYearFolders", () => {
  it("finds customers and years sorted by name and year", () => {
    const folders = findYearFolders(sample);
    expect(folders.map((f) => [f.customer, f.year, f.path])).toEqual([
      ["Anna", 2019, "CustomerAnna/2019/"],
      ["Test", 2018, "CustomerTest/2018/"],
      ["Test", 2019, "CustomerTest/2019/"],
    ]);
  });

  it("lists the files below the year folder", () => {
    const folder = findYearFolders(sample).find((f) => f.year === 2019 && f.customer === "Test");
    expect(folder?.fileNames.sort()).toEqual([
      "Address.csv",
      "Template/Document.html",
      "Template/logo.png",
    ]);
  });

  it("ignores a root folder in the ZIP file", () => {
    const archive = archiveOf({
      "Anteilsscheine/CustomerTest/2019/Address.csv": "Id,Name\r\n",
    });
    const [folder] = findYearFolders(archive);
    expect(folder).toMatchObject({
      customer: "Test",
      year: 2019,
      path: "Anteilsscheine/CustomerTest/2019/",
    });
    expect(folder && getYearFile(archive, folder, "Address.csv")).toBeDefined();
  });

  it("returns nothing for an archive without year folders", () => {
    expect(findYearFolders(archiveOf({ "readme.txt": "x" }))).toEqual([]);
  });
});

describe("exportFileName", () => {
  it("uses customer, year and export date", () => {
    expect(exportFileName("Test", 2019, { year: 2026, month: 11, day: 15 })).toBe(
      "Anteilsscheine_Test_2019_2026-11-15.zip",
    );
  });
});
