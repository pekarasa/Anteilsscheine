import type { RawRow, RawTable } from "../model/types";
import { parseGermanDate } from "../io/dates";
import {
  cellKindOf,
  cellProblem,
  displayCell,
  normalizeCell,
  type CellKind,
  type CellProblem,
} from "../io/cells";
import { addRow, removeRow, setCell } from "../io/tableEdit";
import type { PublishKind } from "../state/store";
import { h } from "./dom";
import { texts } from "./texts";

/** Sorting and search of one table. Kept outside the table so that it survives re-rendering. */
export interface TableView {
  query: string;
  sortColumn?: string;
  descending: boolean;
}

export interface AddressChoice {
  id: number;
  name: string;
}

export interface DataTableOptions {
  view: TableView;
  /** The table as it is now. Read again for every change of the view. */
  readTable: () => RawTable;
  /** Preferred column order. Columns of the file that are not listed follow at the end. */
  columns: string[];
  addresses: AddressChoice[];
  /** Source line of a row to highlight, e.g. after a jump from the review. */
  focusLine?: number;
  /** Values of a new row. Columns without a value stay empty. */
  newRowValues?: (table: RawTable) => Record<string, string>;
  /** A warning shown before a row is deleted. */
  deleteWarning?: (rowIndex: number) => string | undefined;
  commit: (change: (table: RawTable) => RawTable, kind: PublishKind) => void;
  /** Renders the whole view again, used after a change of the sort order. */
  refresh: () => void;
}

const labels: Record<string, string | undefined> = texts.columns;

export function dataTable(options: DataTableOptions): HTMLElement {
  const { view } = options;
  const header = options.readTable().header;
  const columns = orderedColumns(header, options.columns);
  const addressIds = new Set(options.addresses.map((address) => address.id));
  const body = h("tbody");
  const count = h("span", { class: "count" });

  const fill = (): void => {
    const table = options.readTable();
    const indexes = visibleRowIndexes(table, view);
    body.replaceChildren(
      ...(indexes.length > 0
        ? indexes.map((index) => rowElement(table, index))
        : [h("tr", {}, h("td", { colspan: String(columns.length + 1), class: "empty" }, texts.tables.empty))]),
    );
    count.textContent = texts.tables.count(indexes.length, table.rows.length);
  };

  const rowElement = (table: RawTable, index: number): HTMLElement => {
    const row = table.rows[index];
    const focused = options.focusLine !== undefined && row?.line === options.focusLine;
    return h(
      "tr",
      { class: focused ? "focus" : undefined, "data-focus": focused },
      ...columns.map((column) => h("td", {}, cellControl(column, cellAt(table, row, column), index))),
      h(
        "td",
        {},
        h("button", { type: "button", class: "row-action", onclick: () => deleteRow(index) }, texts.tables.deleteRow),
      ),
    );
  };

  const cellControl = (column: string, value: string, index: number): HTMLElement => {
    const kind = cellKindOf(column);
    const apply = (next: string): void => {
      options.commit((table) => setCell(table, index, column, next), "data");
    };
    if (kind === "address") {
      const select: HTMLSelectElement = h(
        "select",
        {
          onchange: () => {
            if (select.value !== value) {
              apply(select.value);
            }
          },
        },
        ...addressOptions(value),
      );
      mark(select, cellProblem(kind, value, addressIds));
      return select;
    }
    const input: HTMLInputElement = h("input", {
      type: "text",
      class: "cell",
      value: displayCell(kind, value),
      inputmode: inputMode(kind),
      placeholder: kind === "date" ? texts.tables.datePlaceholder : undefined,
      oninput: () => {
        mark(input, cellProblem(kind, normalizeCell(kind, input.value), addressIds));
      },
      onchange: () => {
        const next = normalizeCell(kind, input.value);
        if (next !== value) {
          apply(next);
        }
      },
    });
    mark(input, cellProblem(kind, displayCell(kind, value), addressIds));
    return input;
  };

  const addressOptions = (value: string): HTMLOptionElement[] => {
    const current = value.trim();
    const known = options.addresses.some((address) => String(address.id) === current);
    const unknown =
      current !== "" && !known ? [h("option", { value, selected: true }, texts.tables.unknownChoice(value))] : [];
    return [
      h("option", { value: "", selected: current === "" }, texts.tables.emptyChoice),
      ...options.addresses.map((address) =>
        h(
          "option",
          { value: String(address.id), selected: String(address.id) === current },
          texts.tables.addressChoice(address.id, address.name),
        ),
      ),
      ...unknown,
    ];
  };

  const deleteRow = (index: number): void => {
    const warning = options.deleteWarning?.(index);
    const question = warning ? `${warning}\n\n${texts.tables.confirmDeleteRow}` : texts.tables.confirmDeleteRow;
    if (window.confirm(question)) {
      options.commit((table) => removeRow(table, index), "full");
    }
  };

  const toggleSort = (column: string): void => {
    if (view.sortColumn === column) {
      view.descending = !view.descending;
    } else {
      view.sortColumn = column;
      view.descending = false;
    }
    options.refresh();
  };

  const search = h("input", {
    type: "search",
    value: view.query,
    placeholder: texts.tables.search,
    "aria-label": texts.tables.search,
    oninput: (event: Event) => {
      view.query = (event.target as HTMLInputElement).value;
      fill();
    },
  });

  fill();
  return h(
    "div",
    { class: "data-table" },
    h(
      "div",
      { class: "table-tools" },
      search,
      count,
      h(
        "button",
        {
          type: "button",
          onclick: () => options.commit((table) => addRow(table, options.newRowValues?.(table)), "full"),
        },
        texts.tables.addRow,
      ),
    ),
    h(
      "div",
      { class: "table-scroll" },
      h(
        "table",
        { class: "grid" },
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            ...columns.map((column) => {
              const sorted = view.sortColumn === column;
              const indicator = sorted
                ? view.descending
                  ? texts.tables.sortedDescending
                  : texts.tables.sortedAscending
                : "";
              return h(
                "th",
                { "aria-sort": sorted ? (view.descending ? "descending" : "ascending") : undefined },
                h(
                  "button",
                  { type: "button", class: "sort", onclick: () => toggleSort(column) },
                  `${columnLabel(column)}${indicator}`,
                ),
              );
            }),
            h("th", {}, ""),
          ),
        ),
        body,
      ),
    ),
  );
}

function columnLabel(column: string): string {
  return labels[column] ?? column;
}

function cellAt(table: RawTable, row: RawRow | undefined, column: string): string {
  return row?.cells[table.header.indexOf(column)] ?? "";
}

function orderedColumns(header: string[], preferred: string[]): string[] {
  const known = preferred.filter((column) => header.includes(column));
  const others = header.filter((column) => !known.includes(column));
  return [...new Set([...known, ...others])];
}

function inputMode(kind: CellKind): string | undefined {
  switch (kind) {
    case "integer":
    case "address":
      return "numeric";
    case "decimal":
      return "decimal";
    default:
      return undefined;
  }
}

function mark(element: HTMLElement, problem: CellProblem | undefined): void {
  element.classList.toggle("problem-error", problem?.severity === "error");
  element.classList.toggle("problem-warning", problem?.severity === "warning");
  element.setAttribute("aria-invalid", String(problem?.severity === "error"));
  if (problem) {
    element.title = problem.message;
  } else {
    element.removeAttribute("title");
  }
}

/** Row indexes after search and sort. The indexes refer to the stored table. */
function visibleRowIndexes(table: RawTable, view: TableView): number[] {
  const query = view.query.trim().toLowerCase();
  const indexes = table.rows
    .map((_, index) => index)
    .filter((index) => {
      if (query === "") {
        return true;
      }
      const cells = table.rows[index]?.cells ?? [];
      return cells.some((cell, position) =>
        displayCell(cellKindOf(table.header[position] ?? ""), cell).toLowerCase().includes(query),
      );
    });
  if (view.sortColumn === undefined) {
    return indexes;
  }
  const position = table.header.indexOf(view.sortColumn);
  const kind = cellKindOf(view.sortColumn);
  const direction = view.descending ? -1 : 1;
  const cellAt = (index: number): string => table.rows[index]?.cells[position] ?? "";
  return indexes.sort((a, b) => direction * compareCells(kind, cellAt(a), cellAt(b)));
}

function compareCells(kind: CellKind, a: string, b: string): number {
  if (kind === "date") {
    const dateA = parseGermanDate(a);
    const dateB = parseGermanDate(b);
    if (dateA && dateB) {
      return dateKey(dateA) - dateKey(dateB);
    }
  }
  return a.trim().localeCompare(b.trim(), "de-CH", { numeric: true });
}

function dateKey(date: { year: number; month: number; day: number }): number {
  return date.year * 10000 + date.month * 100 + date.day;
}
