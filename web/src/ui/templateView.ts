import type { YearReadResult } from "../io/validation";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { texts } from "./texts";

type TemplateFile = keyof typeof texts.template.fields;

const files: TemplateFile[] = ["document", "tableHeader", "tableItem", "tableFooter"];

/** The letter template. Placeholders are inserted into the field that had the focus last. */
export function templatePanel(ctx: ViewContext, read: YearReadResult): HTMLElement {
  const { store } = ctx;
  if (!read.model) {
    return h("p", { class: "notice" }, texts.errors.noYearData);
  }
  const template = read.model.template;

  const field = (file: TemplateFile): HTMLTextAreaElement => {
    const area: HTMLTextAreaElement = h(
      "textarea",
      {
        class: "code",
        spellcheck: "false",
        rows: "12",
        "aria-label": texts.template.fields[file],
        onfocus: () => {
          active = area;
        },
        onchange: () => {
          const current = store.getState().read?.model?.template[file];
          if (current !== undefined && area.value !== current) {
            store.updateTemplate((latest) => ({ ...latest, [file]: area.value }), "data");
          }
        },
      },
      template[file],
    );
    return area;
  };

  const areas: Record<TemplateFile, HTMLTextAreaElement> = {
    document: field("document"),
    tableHeader: field("tableHeader"),
    tableItem: field("tableItem"),
    tableFooter: field("tableFooter"),
  };
  let active = areas.document;

  const insert = (name: string): void => {
    active.setRangeText(`\${${name}}`, active.selectionStart, active.selectionEnd, "end");
    active.dispatchEvent(new Event("change"));
    active.focus();
  };

  return h(
    "section",
    {},
    h("p", { class: "intro" }, texts.template.intro),
    h("p", { class: "intro" }, texts.template.placeholdersHint),
    h(
      "div",
      { class: "placeholders" },
      ...Object.entries(texts.template.placeholders).map(([name, label]) =>
        h(
          "button",
          { type: "button", class: "placeholder", title: `\${${name}}`, onclick: () => insert(name) },
          label,
        ),
      ),
    ),
    ...files.map((file) => h("label", { class: "field wide" }, h("span", {}, texts.template.fields[file]), areas[file])),
  );
}
