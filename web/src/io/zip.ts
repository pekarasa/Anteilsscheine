import JSZip from "jszip";
import type { CalendarDate } from "../model/types";
import { formatIsoDate } from "./dates";

/** File names inside a year folder, relative to that folder. */
export const yearFileNames = {
  address: "Address.csv",
  transaction: "Transaction.csv",
  dynamicShare: "DynamicShare.csv",
  powerEarning: "PowerEarning.csv",
  conversionFactor: "ConversionFactor.csv",
  settings: "Settings.json",
  document: "Template/Document.html",
  tableHeader: "Template/TableHeader.html",
  tableItem: "Template/TableItem.html",
  tableFooter: "Template/TableFooter.html",
  logo: "Template/logo.png",
} as const;

/** All entries of an archive, keyed by their full path with "/" separators. */
export type Archive = Map<string, Uint8Array>;

export interface YearFolder {
  customer: string;
  year: number;
  /** Full path prefix of the year folder, always ending with "/". */
  path: string;
  /** Names of the files below the year folder, relative to it. */
  fileNames: string[];
}

const yearFolderPattern = /^((?:.*?\/)?)Customer([^/]+)\/(\d{4})\/.+$/;

export async function readArchive(bytes: Uint8Array): Promise<Archive> {
  const zip = await JSZip.loadAsync(bytes);
  const archive: Archive = new Map();
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  for (const entry of entries) {
    const path = entry.name.replace(/\\/g, "/");
    if (path.startsWith("__MACOSX/")) {
      continue;
    }
    archive.set(path, await entry.async("uint8array"));
  }
  return archive;
}

export async function writeArchive(archive: Archive): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [path, bytes] of archive) {
    zip.file(path, bytes);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

/** Finds all year folders of the form [root/]Customer<Name>/<Year>/. */
export function findYearFolders(archive: Archive): YearFolder[] {
  const folders = new Map<string, YearFolder>();
  for (const path of archive.keys()) {
    const match = yearFolderPattern.exec(path);
    if (!match) {
      continue;
    }
    const [, root = "", customer = "", yearText = ""] = match;
    const folderPath = `${root}Customer${customer}/${yearText}/`;
    const existing = folders.get(folderPath);
    if (existing) {
      continue;
    }
    folders.set(folderPath, {
      customer,
      year: Number(yearText),
      path: folderPath,
      fileNames: [],
    });
  }
  for (const folder of folders.values()) {
    folder.fileNames = [...archive.keys()]
      .filter((path) => path.startsWith(folder.path))
      .map((path) => path.slice(folder.path.length));
  }
  return [...folders.values()].sort(
    (a, b) => a.customer.localeCompare(b.customer) || a.year - b.year,
  );
}

export function getYearFile(archive: Archive, folder: YearFolder, fileName: string): Uint8Array | undefined {
  return archive.get(folder.path + fileName);
}

export function exportFileName(customer: string, year: number, exportDate: CalendarDate): string {
  return `Anteilsscheine_${customer}_${year}_${formatIsoDate(exportDate)}.zip`;
}
