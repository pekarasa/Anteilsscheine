import { parseIsoDate, formatIsoDate } from "../io/dates";
import type { YearReadResult } from "../io/validation";
import { yearFileNames } from "../io/zip";
import type { Settings } from "../model/types";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { texts } from "./texts";

/** Print date and signers of the year, stored in Settings.json. */
export function settingsPanel(ctx: ViewContext, read: YearReadResult): HTMLElement {
  const { store, local } = ctx;
  if (!read.model) {
    return h("p", { class: "notice" }, texts.errors.noYearData);
  }
  const settings = read.model.settings;
  if (!settings) {
    return h(
      "div",
      {},
      h("p", { class: "notice" }, texts.settings.invalid),
      h(
        "button",
        {
          type: "button",
          onclick: () => {
            if (window.confirm(texts.settings.confirmRepair)) {
              store.resetSettings();
            }
          },
        },
        texts.settings.repair,
      ),
    );
  }

  const current = (): Settings => store.getState().read?.model?.settings ?? settings;
  const dateInput: HTMLInputElement = h("input", {
    type: "date",
    value: settings.printDate,
    onchange: () => {
      const date = parseIsoDate(dateInput.value);
      if (!date) {
        local.message = texts.settings.invalidDate;
        ctx.render();
        return;
      }
      store.updateSettings({ ...current(), printDate: formatIsoDate(date) });
    },
  });
  const signerInput = (field: "signer1" | "signer2", label: string): HTMLElement => {
    const input: HTMLInputElement = h("input", {
      type: "text",
      value: settings[field],
      onchange: () => store.updateSettings({ ...current(), [field]: input.value }),
    });
    return h("label", { class: "field" }, h("span", {}, label), input);
  };

  const missing = read.fileIssues.some(
    (issue) => issue.file === yearFileNames.settings && issue.severity === "warning",
  );
  return h(
    "div",
    {},
    h("p", { class: "intro" }, texts.settings.intro),
    missing ? h("p", { class: "notice" }, texts.settings.missing) : undefined,
    h("label", { class: "field" }, h("span", {}, texts.settings.printDate), dateInput),
    signerInput("signer1", texts.settings.signer1),
    signerInput("signer2", texts.settings.signer2),
  );
}
