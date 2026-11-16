import { readYear, type YearReadResult } from "../io/validation";
import { createYear, saveYear } from "../io/yearOps";
import { exportFileName, findYearFolders, writeArchive, type Archive, type YearFolder } from "../io/zip";
import type { CalendarDate } from "../model/types";
import { texts } from "../ui/texts";

export const tabIds = [
  "addresses",
  "transactions",
  "dynamicShares",
  "powerEarnings",
  "conversionFactors",
  "settings",
  "template",
  "print",
] as const;

export type TabId = (typeof tabIds)[number];
export type View = "start" | "main";

/** Everything needed to continue a session later. */
export interface SessionSnapshot {
  archive: Archive;
  sourceName: string;
  folderPath?: string;
  view: View;
  tab: TabId;
}

export interface AppState {
  view: View;
  tab: TabId;
  /** Working copy of the loaded ZIP file. Undefined until a file is loaded. */
  archive?: Archive;
  sourceName: string;
  folders: YearFolder[];
  folder?: YearFolder;
  read?: YearReadResult;
  /** Increases with every change of the archive. */
  revision: number;
  /** Revision of the last download. Undefined after a restore, until the next download. */
  savedRevision?: number;
}

export type StoreListener = (state: AppState) => void;

const initialState: AppState = {
  view: "start",
  tab: "addresses",
  sourceName: "",
  folders: [],
  revision: 0,
};

/** Central state of the application. Changes are published to all subscribers. */
export class AppStore {
  private state: AppState = initialState;
  private readonly listeners = new Set<StoreListener>();

  constructor(private readonly today: () => CalendarDate) {}

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isDirty(): boolean {
    return this.state.archive !== undefined && this.state.savedRevision !== this.state.revision;
  }

  loadArchive(archive: Archive, sourceName: string): void {
    const folders = findYearFolders(archive);
    const first = folders[0];
    if (!first) {
      throw new Error(texts.errors.noYearFolders);
    }
    const revision = this.state.revision + 1;
    this.setState({
      view: "start",
      archive,
      sourceName,
      folders,
      ...this.focus(archive, latestYear(folders, first.customer)),
      revision,
      savedRevision: revision,
    });
  }

  restore(snapshot: SessionSnapshot): void {
    const folders = findYearFolders(snapshot.archive);
    const folder = folders.find((candidate) => candidate.path === snapshot.folderPath);
    this.setState({
      view: folder ? snapshot.view : "start",
      tab: snapshot.tab,
      archive: snapshot.archive,
      sourceName: snapshot.sourceName,
      folders,
      ...this.focus(snapshot.archive, folder),
      revision: this.state.revision + 1,
      savedRevision: undefined,
    });
  }

  snapshot(): SessionSnapshot | undefined {
    const { archive, sourceName, folder, view, tab } = this.state;
    if (!archive) {
      return undefined;
    }
    return { archive, sourceName, folderPath: folder?.path, view, tab };
  }

  selectYear(customer: string, year: number): void {
    const { archive, folders } = this.state;
    const folder = folders.find((candidate) => candidate.customer === customer && candidate.year === year);
    if (!archive || !folder) {
      throw new Error(`Unknown year folder ${customer}/${year}.`);
    }
    this.setState(this.focus(archive, folder));
  }

  setTab(tab: TabId): void {
    this.setState({ tab });
  }

  showStart(): void {
    this.setState({ view: "start" });
  }

  openMain(): void {
    this.loaded();
    this.setState({ view: "main" });
  }

  /** Copies the selected year to targetYear and selects the new year. */
  createYear(targetYear: number): void {
    const { archive, folder } = this.loaded();
    const created = createYear(archive, folder, targetYear, this.today());
    this.setState({
      view: "main",
      folders: findYearFolders(archive),
      ...this.focus(archive, created),
      revision: this.state.revision + 1,
    });
  }

  /** Builds the ZIP file. The working copy is left unchanged. */
  async buildExport(): Promise<{ bytes: Uint8Array; fileName: string }> {
    const { archive, folder, read } = this.loaded();
    const copy: Archive = new Map(archive);
    if (read.model) {
      saveYear(copy, folder, read.model, read.data);
    }
    return {
      bytes: await writeArchive(copy),
      fileName: exportFileName(folder.customer, folder.year, this.today()),
    };
  }

  markSaved(): void {
    this.setState({ savedRevision: this.state.revision });
  }

  close(): void {
    this.setState({
      view: "start",
      archive: undefined,
      sourceName: "",
      folders: [],
      folder: undefined,
      read: undefined,
      revision: this.state.revision + 1,
      savedRevision: undefined,
    });
  }

  private loaded(): { archive: Archive; folder: YearFolder; read: YearReadResult } {
    const { archive, folder, read } = this.state;
    if (!archive || !folder || !read) {
      throw new Error("No year is selected.");
    }
    return { archive, folder, read };
  }

  private focus(
    archive: Archive,
    folder: YearFolder | undefined,
  ): Pick<AppState, "folder" | "read"> {
    return {
      folder,
      read: folder ? readYear(archive, folder, this.today()) : undefined,
    };
  }

  private setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

function latestYear(folders: YearFolder[], customer: string): YearFolder | undefined {
  return folders.filter((folder) => folder.customer === customer).at(-1);
}
