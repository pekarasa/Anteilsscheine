import { describe, expect, it } from "vitest";
import { AppStore } from "../src/state/store";
import { addRow, setCell } from "../src/io/tableEdit";
import { readArchive, type Archive } from "../src/io/zip";
import type { CalendarDate } from "../src/model/types";
import { yearArchive } from "./helpers/archive";

const today: CalendarDate = { year: 2026, month: 11, day: 16 };
const decoder = new TextDecoder();

function twoYearArchive(): Archive {
  return new Map([...yearArchive({}, "CustomerTest/2018/"), ...yearArchive()]);
}

function newStore(): AppStore {
  return new AppStore(() => today);
}

describe("AppStore", () => {
  it("selects the latest year of the first customer after loading", () => {
    const store = newStore();
    store.loadArchive(twoYearArchive(), "daten.zip");
    const state = store.getState();
    expect(state.folder?.year).toBe(2019);
    expect(state.folder?.customer).toBe("Test");
    expect(state.read?.data).toBeDefined();
    expect(state.sourceName).toBe("daten.zip");
    expect(state.view).toBe("start");
  });

  it("rejects an archive without year folders and keeps the state", () => {
    const store = newStore();
    const archive: Archive = new Map([["readme.txt", new TextEncoder().encode("x")]]);
    expect(() => store.loadArchive(archive, "leer.zip")).toThrow("Jahresordner");
    expect(store.getState().archive).toBeUndefined();
  });

  it("is clean after loading and dirty after a change", () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    expect(store.isDirty()).toBe(false);
    store.createYear(2020);
    expect(store.isDirty()).toBe(true);
    store.markSaved();
    expect(store.isDirty()).toBe(false);
  });

  it("selects another year of the same customer", () => {
    const store = newStore();
    store.loadArchive(twoYearArchive(), "daten.zip");
    store.selectYear("Test", 2018);
    expect(store.getState().folder?.year).toBe(2018);
    expect(store.getState().read?.model?.year).toBe(2018);
  });

  it("creates a new year, selects it and opens the main view", () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    store.createYear(2020);
    const state = store.getState();
    expect(state.view).toBe("main");
    expect(state.folder?.year).toBe(2020);
    expect(state.folders.map((folder) => folder.year)).toEqual([2019, 2020]);
    expect(state.archive?.has("CustomerTest/2020/Address.csv")).toBe(true);
  });

  it("keeps the state when the new year already exists", () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    expect(() => store.createYear(2019)).toThrow("existiert bereits");
    expect(store.getState().folder?.year).toBe(2019);
    expect(store.isDirty()).toBe(false);
  });

  it("exports a ZIP with the summary but does not change the working copy", async () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    const { bytes, fileName } = await store.buildExport();
    expect(fileName).toBe("Anteilsscheine_Test_2019_2026-11-16.zip");
    const exported = await readArchive(bytes);
    expect(decoder.decode(exported.get("CustomerTest/Summary_2019.csv"))).toContain("Year: 2019");
    expect(store.getState().archive?.has("CustomerTest/Summary_2019.csv")).toBe(false);
  });

  it("restores a snapshot as dirty and in the saved view", () => {
    const store = newStore();
    store.loadArchive(twoYearArchive(), "daten.zip");
    store.selectYear("Test", 2018);
    store.openMain();
    store.setTab("template");
    const snapshot = store.snapshot();

    const restored = newStore();
    restored.restore(snapshot!);
    expect(restored.getState().folder?.year).toBe(2018);
    expect(restored.getState().view).toBe("main");
    expect(restored.getState().tab).toBe("template");
    expect(restored.isDirty()).toBe(true);
  });

  it("falls back to the start view when the restored year is missing", () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    store.openMain();
    const snapshot = store.snapshot()!;
    const restored = newStore();
    restored.restore({ ...snapshot, folderPath: "CustomerGone/2001/" });
    expect(restored.getState().view).toBe("start");
    expect(restored.getState().folder).toBeUndefined();
  });

  it("has no snapshot without an archive and forgets everything on close", () => {
    const store = newStore();
    expect(store.snapshot()).toBeUndefined();
    store.loadArchive(yearArchive(), "daten.zip");
    store.close();
    expect(store.getState().archive).toBeUndefined();
    expect(store.isDirty()).toBe(false);
  });

  it("writes a table change to the working copy and the export", async () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    store.updateTable("address", (table) => setCell(table, 0, "Name", "Neu Graf"));
    expect(store.getState().read?.data?.addresses[0]?.name).toBe("Neu Graf");
    expect(decoder.decode(store.getState().archive?.get("CustomerTest/2019/Address.csv"))).toContain(
      "Neu Graf",
    );
    expect(store.isDirty()).toBe(true);
    const exported = await readArchive((await store.buildExport()).bytes);
    expect(decoder.decode(exported.get("CustomerTest/2019/Address.csv"))).toContain("Neu Graf");
  });

  it("keeps the table change in a restored session", () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    store.updateTable("address", (table) => setCell(table, 0, "Name", "Neu Graf"));
    const restored = newStore();
    restored.restore(store.snapshot()!);
    expect(restored.getState().read?.data?.addresses[0]?.name).toBe("Neu Graf");
  });

  it("updates the summary and removes it while the data is invalid", () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    expect(store.getState().archive?.has("CustomerTest/Summary_2019.csv")).toBe(false);
    store.updateTable("transaction", (table) => setCell(table, 0, "Amount", "abc"));
    expect(store.getState().read?.data).toBeUndefined();
    expect(store.getState().read?.issues.some((issue) => issue.severity === "error")).toBe(true);
    store.updateTable("transaction", (table) => setCell(table, 0, "Amount", "300"));
    expect(store.getState().read?.data?.transactions[0]?.amount).toBe(300);
    expect(decoder.decode(store.getState().archive?.get("CustomerTest/Summary_2019.csv"))).toContain(
      "Year: 2019",
    );
  });

  it("publishes a data change with its kind", () => {
    const store = newStore();
    store.loadArchive(yearArchive(), "daten.zip");
    const kinds: string[] = [];
    store.subscribe((_state, kind) => kinds.push(kind));
    store.updateTable("address", (table) => setCell(table, 0, "City", "Basel"), "data");
    store.updateTable("address", (table) => addRow(table));
    expect(kinds).toEqual(["data", "full"]);
  });

  it("notifies subscribers and stops after unsubscribe", () => {
    const store = newStore();
    const seen: string[] = [];
    const unsubscribe = store.subscribe((state) => seen.push(state.view));
    store.loadArchive(yearArchive(), "daten.zip");
    unsubscribe();
    store.openMain();
    expect(seen).toEqual(["start"]);
  });
});
