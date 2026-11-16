import type { Certificate } from "../logic/certificate";
import { calculateTotals, calculateYearCertificates } from "../logic/certificateCollection";
import type { YearReadResult } from "../io/validation";
import { h } from "./dom";
import { texts } from "./texts";

/** The summary as in Summary_<Jahr>.csv, with a total row. Read-only. */
export function summaryPanel(read: YearReadResult): HTMLElement {
  if (!read.data) {
    return h("p", { class: "notice" }, texts.summary.unavailable);
  }
  let certificates: Certificate[];
  try {
    certificates = calculateYearCertificates(read.data);
  } catch (failure) {
    return h("p", { class: "notice" }, failure instanceof Error ? failure.message : texts.summary.unavailable);
  }
  const totals = calculateTotals(certificates);
  return h(
    "div",
    {},
    h("h2", {}, texts.summary.title),
    h("p", { class: "intro" }, texts.summary.intro),
    h(
      "div",
      { class: "table-scroll" },
      h(
        "table",
        { class: "grid" },
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            h("th", {}, texts.summary.columns.id),
            h("th", {}, texts.summary.columns.name),
            h("th", {}, texts.summary.columns.street),
            h("th", {}, texts.summary.columns.city),
            h("th", { class: "num" }, texts.summary.columns.held),
            h("th", { class: "num" }, texts.summary.columns.remaining),
            h("th", { class: "num" }, texts.summary.columns.committed),
          ),
        ),
        h(
          "tbody",
          {},
          ...certificates.map((certificate) =>
            h(
              "tr",
              {},
              h("td", {}, String(certificate.address.id)),
              h("td", {}, certificate.address.name),
              h("td", {}, certificate.address.street),
              h("td", {}, certificate.address.city),
              h("td", { class: "num" }, String(certificate.numberOfCertificatesHeld)),
              h("td", { class: "num" }, String(certificate.remainingBalance)),
              h("td", { class: "num" }, String(certificate.numberOfCommittedCertificates)),
            ),
          ),
          h(
            "tr",
            { class: "total" },
            h("td", {}, ""),
            h("td", {}, texts.summary.total),
            h("td", {}, ""),
            h("td", {}, ""),
            h("td", { class: "num" }, String(totals.totalNumberOfCertificates)),
            h("td", { class: "num" }, String(totals.totalRemainingBalance)),
            h("td", { class: "num" }, String(totals.totalNumberOfCommittedCertificates)),
          ),
        ),
      ),
    ),
  );
}
