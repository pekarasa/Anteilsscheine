import type { Template, YearData } from "../model/types";
import type { YearReadResult } from "../io/validation";
import { buildLetterPreview } from "../template/printDocument";
import {
  bodyContent,
  protectEscapedDollars,
  replaceBodyContent,
  restoreEscapedDollars,
} from "../template/templateBody";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { mountEditor, type EditorHandle } from "./editor";
import { logoSection } from "./logo";
import { texts } from "./texts";

type TemplateFile = keyof typeof texts.template.fields;

/** The part of the template that is edited, with the function that inserts a placeholder into it. */
interface Editing {
  element: HTMLElement;
  insert: (name: string) => void;
}

const htmlFiles: TemplateFile[] = ["document", "tableHeader", "tableItem", "tableFooter"];

/**
 * The letter template. The body of Document.html is edited as WYSIWYG by
 * default; the HTML mode shows all template files.
 */
export function templatePanel(ctx: ViewContext, read: YearReadResult): HTMLElement {
  const { store, local } = ctx;
  if (!read.model) {
    return h("p", { class: "notice" }, texts.errors.noYearData);
  }
  const template = read.model.template;
  const body = bodyContent(template.document);
  const htmlMode = body === undefined || local.templateHtml === true;
  const preview = previewSection(ctx, read.data);
  const changed = (): void => preview.refresh();

  const editing = htmlMode ? htmlFields(ctx, template, changed) : wysiwygField(ctx, body ?? "", changed);

  const toggle: HTMLInputElement = h("input", {
    type: "checkbox",
    checked: htmlMode,
    disabled: body === undefined,
    onchange: () => {
      local.templateHtml = toggle.checked;
      ctx.render();
    },
  });

  return h(
    "section",
    {},
    h(
      "div",
      { class: "actions" },
      h(
        "button",
        {
          type: "button",
          onclick: () => {
            if (window.confirm(texts.template.confirmReset)) {
              store.resetTemplate();
            }
          },
        },
        texts.template.reset,
      ),
      h("label", {}, toggle, texts.template.htmlMode),
    ),
    h("p", { class: "intro" }, texts.template.resetHint),
    body === undefined ? h("p", { class: "notice" }, texts.errors.templateWithoutBody) : undefined,
    h("p", { class: "intro" }, texts.template.intro),
    htmlMode ? h("p", { class: "intro" }, texts.template.htmlHint) : undefined,
    h("p", { class: "intro" }, texts.template.placeholdersHint),
    h(
      "div",
      { class: "placeholders" },
      ...Object.entries(texts.template.placeholders).map(([name, label]) =>
        h(
          "button",
          { type: "button", class: "placeholder", title: `\${${name}}`, onclick: () => editing.insert(name) },
          label,
        ),
      ),
    ),
    editing.element,
    logoSection(ctx, template.logo),
    preview.element,
  );
}

function wysiwygField(ctx: ViewContext, body: string, changed: () => void): Editing {
  const { store } = ctx;
  const host = h("div", { class: "editor-host" });
  let handle: EditorHandle | undefined;
  queueMicrotask(() => {
    if (!host.isConnected) {
      return;
    }
    handle = mountEditor(host, protectEscapedDollars(body), (html) => {
      const current = store.getState().read?.model?.template.document ?? "";
      const next = replaceBodyContent(current, restoreEscapedDollars(html));
      if (next !== current) {
        store.updateTemplate((template) => ({ ...template, document: next }), "data");
        changed();
      }
    });
  });
  return {
    element: h("section", { class: "field wide" }, h("span", {}, texts.template.fields.document), host),
    insert: (name) => handle?.insert(`\${${name}}`),
  };
}

/** One text area per template file. The placeholder goes into the area that had the focus last. */
function htmlFields(ctx: ViewContext, template: Template, changed: () => void): Editing {
  const { store } = ctx;
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
            changed();
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
  return {
    element: h(
      "section",
      {},
      ...htmlFiles.map((file) =>
        h("label", { class: "field wide" }, h("span", {}, texts.template.fields[file]), areas[file]),
      ),
    ),
    insert: (name) => {
      active.setRangeText(`\${${name}}`, active.selectionStart, active.selectionEnd, "end");
      active.dispatchEvent(new Event("change"));
      active.focus();
    },
  };
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
