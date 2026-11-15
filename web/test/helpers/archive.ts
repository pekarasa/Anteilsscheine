import type { Archive } from "../../src/io/zip";

const encoder = new TextEncoder();

/** A small, invented customer with one year (2019). */
export const validYearFiles: Record<string, string> = {
  "Address.csv": "Id,Name,Street,City\r\n101,Maya Graf,Unter der Fluh 22,4450 Sissach\r\n",
  "Transaction.csv": "AddressId,Date,Description,Amount\r\n101,09.12.2011,Kauf Anteilsscheine,200\r\n",
  "DynamicShare.csv": "AddressId,Date,PowerPurchase\r\n101,31.12.2019,600\r\n",
  "PowerEarning.csv": "Year,Earning\r\n2019,50000\r\n",
  "ConversionFactor.csv": "Year,Factor\r\n2019,0.8\r\n",
  "Settings.json": '{"printDate":"2026-02-28","signer1":"Max Mustermann","signer2":"John Doe"}',
  "Template/Document.html": "<p>${addressName}</p>",
  "Template/TableHeader.html": "<table>",
  "Template/TableItem.html": "<tr><td>${Date}</td><td>${Description}</td><td>${Amount}</td></tr>",
  "Template/TableFooter.html": "</table>",
};

/**
 * Builds an archive with the year 2019 of customer "Test" below a root folder.
 * Values in `overrides` replace files, null removes them.
 */
export function yearArchive(
  overrides: Record<string, string | Uint8Array | null> = {},
  root = "CustomerTest/2019/",
): Archive {
  const files: Archive = new Map();
  for (const [name, text] of Object.entries(validYearFiles)) {
    files.set(root + name, encoder.encode(text));
  }
  for (const [name, value] of Object.entries(overrides)) {
    const path = root + name;
    if (value === null) {
      files.delete(path);
    } else {
      files.set(path, typeof value === "string" ? encoder.encode(value) : value);
    }
  }
  return files;
}
