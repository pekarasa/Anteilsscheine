import { connectAutosave, type SessionStorage } from "../state/persistence";
import type { AppStore } from "../state/store";
import { h } from "./dom";
import type { LocalState, ViewContext } from "./context";
import { mainView, statusLabel } from "./mainView";
import { startView } from "./startView";
import { texts } from "./texts";

export function mountApp(root: HTMLElement, store: AppStore, storage: SessionStorage): void {
  const local: LocalState = { storageFailed: false, tables: {} };
  const ctx: ViewContext = { store, storage, local, render };

  function render(): void {
    const { view, folder, read } = store.getState();
    const body = view === "main" && folder && read ? mainView(ctx, folder, read) : startView(ctx);
    root.replaceChildren(h("h1", {}, texts.appTitle), body);
    root.querySelector("[data-focus]")?.scrollIntoView({ block: "center" });
    local.focus = undefined;
  }

  store.subscribe((_state, kind) => {
    if (kind === "data") {
      // Keeps the focused field and the mouse target of the next click alive.
      root.querySelector(".status")?.replaceWith(statusLabel(store.isDirty()));
      return;
    }
    local.message = undefined;
    render();
  });

  connectAutosave(store, storage, () => {
    local.storageFailed = true;
    render();
  });

  storage.load().then(
    (session) => {
      if (session && !store.getState().archive) {
        local.restore = session;
        render();
      }
    },
    () => {
      local.storageFailed = true;
      render();
    },
  );

  window.addEventListener("beforeunload", (event) => {
    if (store.isDirty()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  render();
}
