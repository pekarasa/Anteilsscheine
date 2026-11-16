import type { AppStore } from "../state/store";
import type { SessionStorage, StoredSession } from "../state/persistence";
import type { TableView } from "./table";

/** UI-only state that is not part of the application data. */
export interface LocalState {
  message?: string;
  restore?: StoredSession;
  storageFailed: boolean;
  /** Search and sort per table, keyed by table name. */
  tables: Record<string, TableView>;
}

export interface ViewContext {
  store: AppStore;
  storage: SessionStorage;
  local: LocalState;
  render: () => void;
}
