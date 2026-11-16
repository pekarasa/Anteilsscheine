import { connectAutosave, type SessionStorage } from "../state/persistence";
import type { AppStore } from "../state/store";
import { h } from "./dom";
import type { LocalState, ViewContext } from "./context";
import { mainView } from "./mainView";
import { startView } from "./startView";
import { texts } from "./texts";

export function mountApp(root: HTMLElement, store: AppStore, storage: SessionStorage): void {
  const local: LocalState = { storageFailed: false };
  const ctx: ViewContext = { store, storage, local, render };

  function render(): void {
    const { view, folder, read } = store.getState();
    const body = view === "main" && folder && read ? mainView(ctx, folder, read) : startView(ctx);
    root.replaceChildren(h("h1", {}, texts.appTitle), body);
  }

  store.subscribe(() => {
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
