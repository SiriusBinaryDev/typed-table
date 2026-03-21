import { createContext, useContext } from "react";

import type { TableInstance } from "@typed-table/core";

export const TableContext = createContext<TableInstance<unknown> | null>(null);

export function useTableContext<TData>(): TableInstance<TData> {
  const table = useContext(TableContext);

  if (!table) {
    throw new Error("useTableContext must be used inside a TableProvider.");
  }

  return table as TableInstance<TData>;
}

