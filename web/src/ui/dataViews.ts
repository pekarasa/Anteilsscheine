import type { RawTable, YearModel } from "../model/types";
import type { YearReadResult } from "../io/validation";
import { nextIntegerValue } from "../io/tableEdit";
import type { TableName, TabId } from "../state/store";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { dataTable, type AddressChoice } from "./table";
import { texts } from "./texts";

export type DataTab = "addresses" | "transactions" | "dynamicShares" | "powerEarnings" | "conversionFactors";

interface TableDefinition {
  name: TableName;
  columns: string[];
  newRowValues?: (table: RawTable) => Record<string, string>;
  deleteWarning?: (model: YearModel, rowIndex: number) => string | undefined;
}

const definitions: Record<DataTab, TableDefinition> = {
  addresses: {
    name: "address",
    columns: ["Id", "Name", "Street", "City"],
    newRowValues: (table) => ({ Id: String(nextIntegerValue(table, "Id")) }),
    deleteWarning: addressDeleteWarning,
  },
  transactions: {
    name: "transaction",
    columns: ["AddressId", "Date", "Description", "Amount"],
  },
  dynamicShares: {
    name: "dynamicShare",
    columns: ["AddressId", "Date", "PowerPurchase"],
  },
  powerEarnings: {
    name: "powerEarning",
    columns: ["Year", "Earning"],
  },
  conversionFactors: {
    name: "conversionFactor",
    columns: ["Year", "Factor"],
  },
};

export function isDataTab(tab: TabId): tab is DataTab {
  return tab in definitions;
}

/** The editable table of one data tab, with its intro text. */
export function dataPanel(ctx: ViewContext, read: YearReadResult, tab: DataTab): HTMLElement {
  const { store, local } = ctx;
  const model = read.model;
  if (!model) {
    return h("p", { class: "notice" }, texts.errors.noYearData);
  }
  const definition = definitions[tab];
  const name = definition.name;
  const view = local.tables[name] ?? { query: "", descending: false };
  local.tables[name] = view;
  const currentModel = (): YearModel | undefined => store.getState().read?.model;
  return h(
    "div",
    {},
    h("p", { class: "intro" }, texts.intro[tab]),
    dataTable({
      view,
      readTable: () => currentModel()?.[name] ?? model[name],
      columns: definition.columns,
      addresses: addressChoices(model.address),
      newRowValues: definition.newRowValues,
      deleteWarning: (rowIndex) => {
        const current = currentModel();
        return current && definition.deleteWarning ? definition.deleteWarning(current, rowIndex) : undefined;
      },
      commit: (change, kind) => store.updateTable(name, change, kind),
      refresh: () => ctx.render(),
    }),
  );
}

function addressChoices(table: RawTable): AddressChoice[] {
  const idPosition = table.header.indexOf("Id");
  const namePosition = table.header.indexOf("Name");
  return table.rows.flatMap((row) => {
    const text = (row.cells[idPosition] ?? "").trim();
    return /^-?\d+$/.test(text) ? [{ id: Number(text), name: row.cells[namePosition] ?? "" }] : [];
  });
}

function addressDeleteWarning(model: YearModel, rowIndex: number): string | undefined {
  const idPosition = model.address.header.indexOf("Id");
  const id = (model.address.rows[rowIndex]?.cells[idPosition] ?? "").trim();
  const transactions = countReferences(model.transaction, id);
  const shares = countReferences(model.dynamicShare, id);
  if (transactions === 0 && shares === 0) {
    return undefined;
  }
  return texts.tables.addressInUse(id, transactions, shares);
}

function countReferences(table: RawTable, addressId: string): number {
  const position = table.header.indexOf("AddressId");
  return table.rows.filter((row) => (row.cells[position] ?? "").trim() === addressId).length;
}
