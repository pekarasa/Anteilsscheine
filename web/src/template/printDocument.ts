import type { YearData } from "../model/types";
import {
  calculatePersonalPowerEarning,
  type Certificate,
} from "../logic/certificate";
import {
  calculateTotals,
  calculateYearCertificates,
  findPowerEarning,
} from "../logic/certificateCollection";
import { texts } from "../ui/texts";
import { fillLetter, type LetterValues } from "./fillTemplate";
import { formatPrintDate } from "./formatting";

export interface PrintFilter {
  /** Only addresses whose name contains this text, case-sensitive. Empty means all. */
  nameFilter: string;
  /** Also create letters for addresses without committed certificates. */
  includeWithoutCertificates: boolean;
}

const logoFileName = "logo.png";

/**
 * Builds one self-contained HTML document with a letter per address. Each
 * letter after the first starts on a new page. The result is printed by the
 * browser ("Save as PDF").
 */
export function buildPrintDocument(data: YearData, filter: PrintFilter): string {
  const certificates = calculateYearCertificates(data);
  return renderDocument(data, certificates, selectCertificates(certificates, filter));
}

/** Number of letters that buildPrintDocument creates for the filter. */
export function countLetters(data: YearData, filter: PrintFilter): number {
  return selectCertificates(calculateYearCertificates(data), filter).length;
}

/**
 * The reason why the letters cannot be created with this filter, if there is
 * one. Without committed certificates the Ertragsanteil cannot be calculated.
 */
export function printProblem(data: YearData, filter: PrintFilter): string | undefined {
  const certificates = calculateYearCertificates(data);
  const selected = selectCertificates(certificates, filter);
  const totals = calculateTotals(certificates);
  if (selected.length > 0 && totals.totalNumberOfCommittedCertificates === 0) {
    return texts.errors.noCommittedCertificates;
  }
  return undefined;
}

/** The letter of one address as it is printed, without page breaks. Used for the preview. */
export function buildLetterPreview(data: YearData, addressId: number): string {
  const certificates = calculateYearCertificates(data);
  return renderDocument(
    data,
    certificates,
    certificates.filter((certificate) => certificate.address.id === addressId),
  );
}

function renderDocument(
  data: YearData,
  certificates: readonly Certificate[],
  selected: readonly Certificate[],
): string {
  const totals = calculateTotals(certificates);
  const powerEarning = findPowerEarning(data);
  const printDate = formatPrintDate(data.settings.printDate);

  const letters = selected.map((certificate, index) => {
    const values: LetterValues = {
      year: data.year,
      plantPowerEarning: powerEarning.earning,
      totalNumberOfShareCertificate: totals.totalNumberOfCertificates,
      address: certificate.address,
      personalNumberOfShareCertificate: certificate.numberOfCertificatesHeld,
      personalPowerEarning: calculatePersonalPowerEarning(
        certificate,
        totals.totalNumberOfCommittedCertificates,
      ),
      personalRemainingBalance: certificate.remainingBalance,
      transactions: certificate.transactionsUpToYear,
      printDate,
      signer1: data.settings.signer1,
      signer2: data.settings.signer2,
    };
    const body = extractBody(fillLetter(data.template, values));
    const classes = index === 0 ? "letter" : "letter letter-break";
    return `<div class="${classes}">${body}</div>`;
  });

  const images = new Map<string, string>();
  if (data.template.logo) {
    images.set(logoFileName, toDataUrl(data.template.logo, "image/png"));
  }

  return inlineImages(
    [
      "<!DOCTYPE html>",
      '<html lang="de-CH">',
      "<head>",
      '<meta charset="utf-8" />',
      `<title>${texts.print.documentTitle(data.year)}</title>`,
      extractStyles(data.template.document),
      "<style>.letter-break { break-before: page; page-break-before: always; }</style>",
      "</head>",
      "<body>",
      ...letters,
      "</body>",
      "</html>",
    ].join("\n"),
    images,
  );
}

export function selectCertificates(
  certificates: readonly Certificate[],
  filter: PrintFilter,
): Certificate[] {
  return certificates.filter(
    (certificate) =>
      certificate.address.name.includes(filter.nameFilter) &&
      (filter.includeWithoutCertificates || certificate.numberOfCommittedCertificates !== 0),
  );
}

function extractBody(html: string): string {
  const match = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html);
  if (!match) {
    throw new Error(texts.errors.templateWithoutBody);
  }
  return match[1] ?? "";
}

function extractStyles(html: string): string {
  return (html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? []).join("\n");
}

/** Replaces references like src="logo.png" or url(logo.png) by data URLs. */
function inlineImages(html: string, images: ReadonlyMap<string, string>): string {
  let result = html;
  for (const [name, dataUrl] of images) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `((?:src|href)\\s*=\\s*["']|url\\(\\s*["']?)${escapedName}(?=["'\\s)>])`,
      "gi",
    );
    result = result.replace(pattern, (_match: string, prefix: string) => `${prefix}${dataUrl}`);
  }
  return result;
}

function toDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}
