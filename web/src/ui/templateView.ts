import { buildLetterPreview } from "../template/printDocument";
import type { YearData } from "../model/types";
import type { YearReadResult } from "../io/validation";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { logoSection } from "./logo";
import { texts } from "./texts";

type TemplateFile = keyof typeof texts.template.fields;

const files: TemplateFile[] = ["document", "tableHeader", "tableItem", "tableFooter"];

/** The letter template with placeholders and a preview. Placeholders go into the field that had the focus last. */
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
            preview.refresh();
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

  const preview = previewSection(ctx, read.data);

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
    logoSection(ctx, template.logo),
    preview.element,
  );
}

interface PreviewSection {
  element: HTMLElement;
  refresh: () => void;
}

/** The letter of one person as it is printed. Refreshes itself without a re-render. */
function previewSection(ctx: ViewContext, initial: YearData | undefined): PreviewSection {
  const { store, local } = ctx;
  if (!initial || initial.addresses.length === 0) {
    return { element: h("p", { class: "notice" }, texts.template.previewUnavailable), refresh: () => undefined };
  }
  const message = h("p", { class: "notice", hidden: true });
  const frame: HTMLIFrameElement = h("iframe", { class: "preview", title: texts.template.previewFrame });
  const select: HTMLSelectElement = h(
    "select",
    {
      onchange: () => {
        local.previewAddressId = Number(select.value);
        refresh();
      },
    },
    ...initial.addresses.map((address) =>
      h(
        "option",
        { value: String(address.id), selected: address.id === selectedId() },
        texts.tables.addressChoice(address.id, address.name),
      ),
    ),
  );

  function selectedId(): number {
    const addresses = store.getState().read?.data?.addresses ?? [];
    const chosen = local.previewAddressId;
    return addresses.find((address) => address.id === chosen)?.id ?? addresses[0]?.id ?? 0;
  }

  function refresh(): void {
    const data = store.getState().read?.data;
    if (!data) {
      return;
    }
    try {
      frame.srcdoc = buildLetterPreview(data, selectedId());
      message.hidden = true;
    } catch (failure) {
      frame.srcdoc = "";
      message.textContent = failure instanceof Error ? failure.message : texts.template.previewFailed;
      message.hidden = false;
    }
  }

  refresh();
  return {
    element: h(
      "section",
      { class: "preview-section" },
      h("h2", {}, texts.template.previewTitle),
      h("p", { class: "intro" }, texts.template.previewHint),
      h("label", { class: "field" }, h("span", {}, texts.template.previewPerson), select),
      message,
      frame,
    ),
    refresh,
  };
}
