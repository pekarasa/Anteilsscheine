import type { YearReadResult } from "../io/validation";
import { readArchive, type Archive, type YearFolder } from "../io/zip";
import type { StoredSession } from "../state/persistence";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { issueList } from "./issues";
import { texts } from "./texts";

export function startView(ctx: ViewContext): HTMLElement {
  const { store, local } = ctx;
  const state = store.getState();
  const children: (HTMLElement | undefined)[] = [
    local.restore && !state.archive ? restoreOffer(ctx, local.restore) : undefined,
    local.storageFailed ? h("p", { class: "notice" }, texts.start.storageUnavailable) : undefined,
  ];
  if (state.archive && state.folder && state.read) {
    children.push(
      loadedFile(ctx, state.sourceName),
      customerAndYear(ctx, state.folders, state.folder),
      review(state.read),
      editCard(ctx, state.folder.year),
      newYearCard(ctx, state.folder.year),
    );
  } else {
    children.push(dropZone(ctx));
  }
  children.push(local.message ? h("p", { class: "alert" }, local.message) : undefined);
  return h("section", { class: "start" }, ...children);
}

function restoreOffer(ctx: ViewContext, session: StoredSession): HTMLElement {
  const { store, storage, local, render } = ctx;
  const savedAt = new Intl.DateTimeFormat("de-CH", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(session.savedAt),
  );
  return h(
    "section",
    { class: "card" },
    h("h2", {}, texts.start.restoreTitle),
    h("p", {}, texts.start.restoreText(savedAt)),
    h(
      "div",
      { class: "actions" },
      h(
        "button",
        {
          type: "button",
          class: "primary",
          onclick: () => {
            local.restore = undefined;
            store.restore(session.snapshot);
          },
        },
        texts.start.restoreButton,
      ),
      h(
        "button",
        {
          type: "button",
          onclick: () => {
            local.restore = undefined;
            render();
            storage.clear().catch(() => {
              local.storageFailed = true;
              render();
            });
          },
        },
        texts.start.discardButton,
      ),
    ),
  );
}

function dropZone(ctx: ViewContext): HTMLElement {
  return h(
    "section",
    {
      class: "dropzone",
      ondragover: (event: Event) => {
        event.preventDefault();
      },
      ondrop: (event: Event) => {
        event.preventDefault();
        const file = (event as DragEvent).dataTransfer?.files[0];
        if (file) {
          void loadFile(ctx, file);
        }
      },
    },
    h("p", { class: "large" }, texts.start.dropZone),
    fileChooser(ctx, texts.start.chooseFile, true),
  );
}

function loadedFile(ctx: ViewContext, sourceName: string): HTMLElement {
  return h(
    "div",
    { class: "loaded" },
    h("span", {}, texts.start.loadedFrom(sourceName)),
    fileChooser(ctx, texts.start.otherFile, false),
  );
}

function fileChooser(ctx: ViewContext, label: string, primary: boolean): HTMLElement {
  const input: HTMLInputElement = h("input", {
    type: "file",
    accept: ".zip,application/zip",
    hidden: true,
    onchange: () => {
      const file = input.files?.[0];
      input.value = "";
      if (file) {
        void loadFile(ctx, file);
      }
    },
  });
  return h(
    "div",
    {},
    input,
    h("button", { type: "button", class: primary ? "primary" : undefined, onclick: () => input.click() }, label),
  );
}

async function loadFile(ctx: ViewContext, file: File): Promise<void> {
  const { store, local, render } = ctx;
  if (store.isDirty() && !window.confirm(texts.start.confirmReplace)) {
    return;
  }
  let archive: Archive;
  try {
    archive = await readArchive(new Uint8Array(await file.arrayBuffer()));
  } catch {
    local.message = texts.errors.invalidZip;
    render();
    return;
  }
  try {
    store.loadArchive(archive, file.name);
    local.restore = undefined;
  } catch (error) {
    local.message = messageOf(error);
    render();
  }
}

function customerAndYear(ctx: ViewContext, folders: YearFolder[], folder: YearFolder): HTMLElement {
  const { store } = ctx;
  const customers = [...new Set(folders.map((candidate) => candidate.customer))];
  const years = folders.filter((candidate) => candidate.customer === folder.customer);
  const customerSelect = h(
    "select",
    {
      onchange: (event: Event) => {
        const customer = (event.target as HTMLSelectElement).value;
        const latest = folders.filter((candidate) => candidate.customer === customer).at(-1);
        if (latest) {
          store.selectYear(customer, latest.year);
        }
      },
    },
    ...customers.map((customer) =>
      h("option", { value: customer, selected: customer === folder.customer }, customer),
    ),
  );
  const yearSelect = h(
    "select",
    {
      onchange: (event: Event) => {
        store.selectYear(folder.customer, Number((event.target as HTMLSelectElement).value));
      },
    },
    ...years.map((candidate) =>
      h("option", { value: String(candidate.year), selected: candidate.year === folder.year }, String(candidate.year)),
    ),
  );
  return h(
    "div",
    { class: "selection" },
    customers.length > 1 ? h("label", {}, `${texts.start.customer}: `, customerSelect) : undefined,
    h("label", {}, `${texts.start.year}: `, yearSelect),
  );
}

function review(read: YearReadResult): HTMLElement {
  return h("section", { class: "review" }, h("h2", {}, texts.review.title), issueList(read.issues));
}

function editCard(ctx: ViewContext, year: number): HTMLElement {
  const { store } = ctx;
  return h(
    "section",
    { class: "card" },
    h("h2", {}, texts.start.editTitle(year)),
    h("p", {}, texts.start.editText),
    h(
      "div",
      { class: "actions" },
      h("button", { type: "button", class: "primary", onclick: () => store.openMain() }, texts.start.editButton),
    ),
  );
}

function newYearCard(ctx: ViewContext, year: number): HTMLElement {
  const { store, local, render } = ctx;
  const targetInput: HTMLInputElement = h("input", {
    type: "number",
    min: "1000",
    max: "9999",
    value: String(year + 1),
  });
  return h(
    "section",
    { class: "card" },
    h("h2", {}, texts.start.newTitle(year)),
    h("p", {}, texts.start.newText),
    h(
      "div",
      { class: "actions" },
      h("label", {}, `${texts.start.targetYear}: `, targetInput),
      h(
        "button",
        {
          type: "button",
          class: "primary",
          onclick: () => {
            try {
              store.createYear(Number(targetInput.value));
            } catch (error) {
              local.message = messageOf(error);
              render();
            }
          },
        },
        texts.start.createButton,
      ),
    ),
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : texts.start.readFailed;
}
