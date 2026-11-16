import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectAutosave, fromRecord, toRecord, type SessionStorage, type StoredSession } from "../src/state/persistence";
import { AppStore } from "../src/state/store";
import type { CalendarDate } from "../src/model/types";
import { yearArchive } from "./helpers/archive";

const today: CalendarDate = { year: 2026, month: 11, day: 16 };

function sampleSession(): StoredSession {
  const archive = yearArchive();
  return {
    savedAt: 1_700_000_000_000,
    snapshot: {
      archive,
      sourceName: "daten.zip",
      folderPath: "CustomerTest/2019/",
      view: "main",
      tab: "template",
    },
  };
}

function fakeStorage(): SessionStorage & { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> } {
  return {
    save: vi.fn(async () => undefined),
    load: vi.fn(async () => undefined),
    clear: vi.fn(async () => undefined),
  };
}

describe("session records", () => {
  it("round-trips a session including all files", () => {
    const session = sampleSession();
    const structured = fromRecord(toRecord(session));
    expect(structured?.savedAt).toBe(session.savedAt);
    expect(structured?.snapshot.sourceName).toBe("daten.zip");
    expect(structured?.snapshot.folderPath).toBe("CustomerTest/2019/");
    expect(structured?.snapshot.view).toBe("main");
    expect(structured?.snapshot.tab).toBe("template");
    expect([...(structured?.snapshot.archive.keys() ?? [])]).toEqual([...session.snapshot.archive.keys()]);
  });

  it("rejects records with a missing or wrong field", () => {
    const record = toRecord(sampleSession());
    expect(fromRecord(undefined)).toBeUndefined();
    expect(fromRecord("text")).toBeUndefined();
    expect(fromRecord({ ...record, tab: "unknown" })).toBeUndefined();
    expect(fromRecord({ ...record, view: "other" })).toBeUndefined();
    expect(fromRecord({ ...record, files: [["a.csv", "not bytes"]] })).toBeUndefined();
    expect(fromRecord({ ...record, savedAt: "today" })).toBeUndefined();
  });

  it("accepts a session without a selected year", () => {
    const record = toRecord(sampleSession());
    expect(fromRecord({ ...record, folderPath: undefined })?.snapshot.folderPath).toBeUndefined();
  });
});

describe("connectAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves once after a burst of changes", async () => {
    const store = new AppStore(() => today);
    const storage = fakeStorage();
    connectAutosave(store, storage, () => undefined, 500);

    store.loadArchive(yearArchive(), "daten.zip");
    store.createYear(2020);
    store.setTab("template");
    expect(storage.save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    expect(storage.save).toHaveBeenCalledTimes(1);
    const saved = storage.save.mock.calls[0]?.[0] as StoredSession;
    expect(saved.snapshot.folderPath).toBe("CustomerTest/2020/");
    expect(saved.snapshot.tab).toBe("template");
  });

  it("clears the session when the archive is closed", async () => {
    const store = new AppStore(() => today);
    const storage = fakeStorage();
    connectAutosave(store, storage, () => undefined, 500);

    store.loadArchive(yearArchive(), "daten.zip");
    store.close();
    await vi.advanceTimersByTimeAsync(500);
    expect(storage.clear).toHaveBeenCalledTimes(1);
  });

  it("reports storage errors without throwing", async () => {
    const store = new AppStore(() => today);
    const storage = fakeStorage();
    const failure = new Error("blocked");
    storage.save.mockRejectedValueOnce(failure);
    const onError = vi.fn();
    connectAutosave(store, storage, onError, 500);

    store.loadArchive(yearArchive(), "daten.zip");
    await vi.advanceTimersByTimeAsync(500);
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("stops after dispose", async () => {
    const store = new AppStore(() => today);
    const storage = fakeStorage();
    const dispose = connectAutosave(store, storage, () => undefined, 500);
    store.loadArchive(yearArchive(), "daten.zip");
    dispose();
    await vi.advanceTimersByTimeAsync(500);
    expect(storage.save).not.toHaveBeenCalled();
  });
});
