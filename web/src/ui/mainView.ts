import type { Issue, YearReadResult } from "../io/validation";
import type { YearFolder } from "../io/zip";
import { tabIds, type TabId } from "../state/store";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { dataPanel, isDataTab, missingDataHints } from "./dataViews";
import { issueList, tabOfIssue } from "./issues";
import { settingsPanel } from "./settingsView";
import { summaryPanel } from "./summaryView";
import { texts } from "./texts";

export function mainView(ctx: ViewContext, folder: YearFolder, read: YearReadResult): HTMLElement {
  const { store, local } = ctx;
  const state = store.getState();
  return h(
    "section",
    { class: "main" },
    h(
      "header",
      { class: "toolbar" },
      h("strong", {}, texts.main.yearLabel(folder.customer, folder.year)),
      statusLabel(store.isDirty()),
      h(
        "div",
        { class: "actions" },
        h(
          "button",
          { type: "button", class: "primary", onclick: () => void download(ctx) },
          texts.main.download,
        ),
        h("button", { type: "button", onclick: () => store.showStart() }, texts.main.changeYear),
      ),
    ),
    local.storageFailed ? h("p", { class: "notice" }, texts.start.storageUnavailable) : undefined,
    local.message ? h("p", { class: "notice" }, local.message) : undefined,
    h(
      "section",
      { class: "review" },
      h("h2", {}, texts.review.title),
      issueList(read.issues, (issue) => jumpTo(ctx, issue)),
      ...(read.model ? missingDataHints(ctx, read.model) : []),
    ),
    h(
      "nav",
      { class: "tabs", role: "tablist" },
      ...tabIds.map((tab) =>
        h(
          "button",
          {
            type: "button",
            role: "tab",
            class: tab === state.tab ? "tab active" : "tab",
            "aria-selected": String(tab === state.tab),
            onclick: () => store.setTab(tab),
          },
          texts.main.tabs[tab],
        ),
      ),
    ),
    h("section", { class: "panel", role: "tabpanel" }, tabContent(ctx, read, state.tab)),
  );
}

export function statusLabel(dirty: boolean): HTMLElement {
  return h("span", { class: dirty ? "status dirty" : "status" }, dirty ? texts.main.unsaved : texts.main.saved);
}

function jumpTo(ctx: ViewContext, issue: Issue): void {
  const tab = tabOfIssue(issue);
  if (!tab) {
    return;
  }
  ctx.local.focus = issue.line !== undefined ? { file: issue.file, line: issue.line } : undefined;
  ctx.store.setTab(tab);
}

function tabContent(ctx: ViewContext, read: YearReadResult, tab: TabId): HTMLElement {
  if (isDataTab(tab)) {
    return dataPanel(ctx, read, tab);
  }
  if (tab === "settings") {
    return settingsPanel(ctx, read);
  }
  if (tab === "print") {
    return summaryPanel(read);
  }
  return h("p", {}, texts.main.tabEmpty);
}

async function download(ctx: ViewContext): Promise<void> {
  const { store, storage, local, render } = ctx;
  try {
    const { bytes, fileName } = await store.buildExport();
    saveFile(bytes, fileName);
    store.markSaved();
    local.message = texts.main.downloaded(fileName);
    storage.clear().catch(() => {
      local.storageFailed = true;
      render();
    });
  } catch {
    local.message = texts.main.downloadFailed;
  }
  render();
}

function saveFile(bytes: Uint8Array, fileName: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
  const link = h("a", { href: url, download: fileName });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
