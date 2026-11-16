import { describeIssue, type Issue } from "../io/validation";
import { yearFileNames } from "../io/zip";
import type { TabId } from "../state/store";
import { texts } from "./texts";
import { h } from "./dom";

const tabByFile: Partial<Record<string, TabId>> = {
  [yearFileNames.address]: "addresses",
  [yearFileNames.transaction]: "transactions",
  [yearFileNames.dynamicShare]: "dynamicShares",
  [yearFileNames.powerEarning]: "powerEarnings",
  [yearFileNames.conversionFactor]: "conversionFactors",
  [yearFileNames.settings]: "settings",
  [yearFileNames.document]: "template",
  [yearFileNames.tableHeader]: "template",
  [yearFileNames.tableItem]: "template",
  [yearFileNames.tableFooter]: "template",
};

/** The tab in which the file of an issue is edited, if there is one. */
export function tabOfIssue(issue: Issue): TabId | undefined {
  return tabByFile[issue.file];
}

/** With onJump, every issue whose file has a tab gets a button to show it. */
export function issueList(issues: Issue[], onJump?: (issue: Issue) => void): HTMLElement {
  if (issues.length === 0) {
    return h("p", { class: "ok" }, texts.review.none);
  }
  return h(
    "ul",
    { class: "issues" },
    ...issues.map((issue) =>
      h(
        "li",
        { class: issue.severity },
        h("strong", {}, `${texts.severity[issue.severity]}: `),
        describeIssue(issue),
        onJump && tabOfIssue(issue)
          ? h("button", { type: "button", class: "link", onclick: () => onJump(issue) }, texts.review.show)
          : undefined,
      ),
    ),
  );
}
