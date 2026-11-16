import { describeIssue, type YearReadResult } from "../io/validation";
import { bodyContent } from "../template/templateBody";
import {
  buildPrintDocument,
  countLetters,
  printProblem,
  type PrintFilter,
} from "../template/printDocument";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { printHtml } from "./printFrame";
import { summaryPanel } from "./summaryView";
import { texts } from "./texts";

interface PrintCheck {
  letters: number;
  problems: string[];
}

/**
 * The print tab: filter, number of letters and the button that opens the
 * print dialog. Below it, the summary of the year.
 */
export function printPanel(ctx: ViewContext, read: YearReadResult): HTMLElement {
  const { store, local } = ctx;
  const filter = (): PrintFilter => local.printFilter ?? { nameFilter: "", includeWithoutCertificates: false };

  const nameInput: HTMLInputElement = h("input", {
    type: "text",
    value: filter().nameFilter,
    oninput: () => {
      local.printFilter = { ...filter(), nameFilter: nameInput.value };
      refresh();
    },
  });
  const withoutInput: HTMLInputElement = h("input", {
    type: "checkbox",
    checked: filter().includeWithoutCertificates,
    onchange: () => {
      local.printFilter = { ...filter(), includeWithoutCertificates: withoutInput.checked };
      refresh();
    },
  });
  const count = h("p", { class: "print-count" });
  const problems = h("div", { class: "print-problems" });
  const button: HTMLButtonElement = h(
    "button",
    { type: "button", class: "primary", onclick: () => void printLetters() },
    texts.print.button,
  );

  function refresh(): void {
    const result = checkPrint(store.getState().read, filter());
    count.textContent = texts.print.letterCount(result.letters);
    problems.replaceChildren(...problemNotices(result));
    button.disabled = result.problems.length > 0 || result.letters === 0;
  }

  async function printLetters(): Promise<void> {
    const current = store.getState().read;
    const result = checkPrint(current, filter());
    if (!current?.data || result.problems.length > 0 || result.letters === 0) {
      refresh();
      return;
    }
    try {
      await printHtml(buildPrintDocument(current.data, filter()));
    } catch (failure) {
      local.message = failure instanceof Error ? failure.message : texts.print.failed;
      ctx.render();
    }
  }

  refresh();
  return h(
    "div",
    {},
    h(
      "section",
      { class: "print" },
      h("h2", {}, texts.print.title),
      h("p", { class: "intro" }, texts.print.intro),
      h(
        "div",
        { class: "print-filter" },
        h("label", { class: "field" }, h("span", {}, texts.print.nameFilter), nameInput),
        h("label", { class: "check" }, withoutInput, texts.print.includeWithoutCertificates),
      ),
      count,
      problems,
      h("div", { class: "actions" }, button),
      h("h3", {}, texts.print.stepsTitle),
      h("ol", { class: "print-steps" }, ...texts.print.steps.map((step) => h("li", {}, step))),
      h("p", { class: "intro" }, texts.print.afterPrint),
    ),
    summaryPanel(read),
  );
}

/** Checks whether letters can be printed. Errors in the data block the print. */
function checkPrint(read: YearReadResult | undefined, filter: PrintFilter): PrintCheck {
  if (!read) {
    return { letters: 0, problems: [texts.summary.unavailable] };
  }
  const errors = read.issues.filter((issue) => issue.severity === "error").map(describeIssue);
  if (errors.length > 0 || !read.data) {
    return { letters: 0, problems: errors.length > 0 ? errors : [texts.summary.unavailable] };
  }
  if (!read.model || bodyContent(read.model.template.document) === undefined) {
    return { letters: 0, problems: [texts.errors.templateWithoutBody] };
  }
  try {
    const problem = printProblem(read.data, filter);
    return {
      letters: countLetters(read.data, filter),
      problems: problem ? [problem] : [],
    };
  } catch (failure) {
    return { letters: 0, problems: [failure instanceof Error ? failure.message : texts.print.failed] };
  }
}

function problemNotices(result: PrintCheck): HTMLElement[] {
  if (result.problems.length > 0) {
    return [
      h("p", { class: "notice" }, texts.print.blocked),
      h("ul", { class: "issues" }, ...result.problems.map((problem) => h("li", { class: "error" }, problem))),
    ];
  }
  if (result.letters === 0) {
    return [h("p", { class: "notice" }, texts.print.noLetters)];
  }
  return [];
}
