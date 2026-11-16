import type { AppStore } from "../state/store";
import type { SessionStorage, StoredSession } from "../state/persistence";

/** UI-only state that is not part of the application data. */
export interface LocalState {
  message?: string;
  restore?: StoredSession;
  storageFailed: boolean;
}

export interface ViewContext {
  store: AppStore;
  storage: SessionStorage;
  local: LocalState;
  render: () => void;
}
