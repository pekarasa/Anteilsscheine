import { describeIssue, type Issue } from "../io/validation";
import { texts } from "./texts";
import { h } from "./dom";

export function issueList(issues: Issue[]): HTMLElement {
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
      ),
    ),
  );
}
