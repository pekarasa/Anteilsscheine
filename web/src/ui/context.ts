import type { PrintFilter } from "../template/printDocument";
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
  /** Shows all template files as HTML instead of the WYSIWYG editor. */
  templateHtml?: boolean;
  /** Address shown in the letter preview of the template tab. */
  previewAddressId?: number;
  /** Filter of the print tab. Undefined means all names, without addresses without certificates. */
  printFilter?: PrintFilter;
  /** Row to highlight after a jump from an issue. Cleared after the next render. */
  focus?: { file: string; line: number };
}

export interface ViewContext {
  store: AppStore;
  storage: SessionStorage;
  local: LocalState;
  render: () => void;
}
