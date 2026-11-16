import type { Archive } from "../io/zip";
import { tabIds, type AppStore, type SessionSnapshot, type TabId, type View } from "./store";

const databaseName = "anteilsscheine";
const storeName = "sessions";
const recordKey = "current";

export interface StoredSession {
  savedAt: number;
  snapshot: SessionSnapshot;
}

export interface SessionStorage {
  save(session: StoredSession): Promise<void>;
  load(): Promise<StoredSession | undefined>;
  clear(): Promise<void>;
}

/** Plain structure for IndexedDB. Maps are stored as entry lists. */
interface SessionRecord {
  savedAt: number;
  sourceName: string;
  folderPath?: string;
  view: View;
  tab: TabId;
  files: [string, Uint8Array][];
}

export function toRecord(session: StoredSession): SessionRecord {
  const { snapshot } = session;
  return {
    savedAt: session.savedAt,
    sourceName: snapshot.sourceName,
    folderPath: snapshot.folderPath,
    view: snapshot.view,
    tab: snapshot.tab,
    files: [...snapshot.archive.entries()],
  };
}

/** Returns undefined for anything that is not a complete record. */
export function fromRecord(value: unknown): StoredSession | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const record = value as Partial<Record<keyof SessionRecord, unknown>>;
  if (
    typeof record.savedAt !== "number" ||
    typeof record.sourceName !== "string" ||
    (record.folderPath !== undefined && typeof record.folderPath !== "string") ||
    (record.view !== "start" && record.view !== "main") ||
    !(tabIds as readonly unknown[]).includes(record.tab) ||
    !Array.isArray(record.files)
  ) {
    return undefined;
  }
  const archive: Archive = new Map();
  for (const entry of record.files as unknown[]) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string" || !(entry[1] instanceof Uint8Array)) {
      return undefined;
    }
    archive.set(entry[0], entry[1]);
  }
  return {
    savedAt: record.savedAt,
    snapshot: {
      archive,
      sourceName: record.sourceName,
      folderPath: record.folderPath,
      view: record.view,
      tab: record.tab as TabId,
    },
  };
}

/**
 * Keeps one session in IndexedDB. Browsers may refuse IndexedDB for pages
 * opened via file://; the returned promises then reject.
 */
export function createIndexedDbStorage(factory: () => IDBFactory = () => indexedDB): SessionStorage {
  return {
    async save(session) {
      await withStore(factory(), "readwrite", (store) => store.put(toRecord(session), recordKey));
    },
    async load() {
      const record: unknown = await withStore(factory(), "readonly", (store) => store.get(recordKey));
      return record === undefined ? undefined : fromRecord(record);
    },
    async clear() {
      await withStore(factory(), "readwrite", (store) => store.delete(recordKey));
    },
  };
}

/**
 * Saves the session shortly after every change of the archive. Bursts of
 * changes are combined into one write. Clearing the archive removes the session.
 * Returns a function that stops the autosave.
 */
export function connectAutosave(
  store: AppStore,
  storage: SessionStorage,
  onError: (error: unknown) => void,
  delayMs = 500,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastRevision: number | undefined;
  const unsubscribe = store.subscribe((state) => {
    if (!state.archive) {
      if (lastRevision !== undefined) {
        lastRevision = undefined;
        clearTimeout(timer);
        storage.clear().catch(onError);
      }
      return;
    }
    if (state.revision === lastRevision) {
      return;
    }
    lastRevision = state.revision;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const snapshot = store.snapshot();
      if (snapshot) {
        storage.save({ savedAt: Date.now(), snapshot }).catch(onError);
      }
    }, delayMs);
  });
  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}

type Mode = IDBTransactionMode;

async function withStore<T>(
  factory: IDBFactory,
  mode: Mode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase(factory);
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
