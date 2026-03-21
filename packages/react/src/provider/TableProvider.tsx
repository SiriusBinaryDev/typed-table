import type { PropsWithChildren } from "react";

import type { TableInstance } from "@typed-table/core";

import { TableContext } from "../context/TableContext.js";

type TableProviderProps<TData> = PropsWithChildren<{
  table: TableInstance<TData>;
}>;

export function TableProvider<TData>({
  children,
  table,
}: TableProviderProps<TData>) {
  return (
    <TableContext.Provider value={table as TableInstance<unknown>}>
      {children}
    </TableContext.Provider>
  );
}

