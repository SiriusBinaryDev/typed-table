import type {
  ColumnDef,
  ColumnPinningState,
  SortingState,
  TableHeader,
} from "../types/index.js";

import { getColumnPinningPosition } from "../columns/getOrderedColumns.js";

export function createHeaders<TData>(
  columns: readonly ColumnDef<TData>[],
  sorting: SortingState<TData>,
  columnPinning?: ColumnPinningState | null,
): TableHeader[] {
  return columns.map((column) => {
    const sortIndex = sorting?.findIndex((entry) => entry.columnId === column.id) ?? -1;
    const sortEntry = sortIndex >= 0 ? sorting?.[sortIndex] : undefined;
    const isSorted = sortIndex >= 0;

    return {
      id: column.id,
      label: column.header,
      pin: getColumnPinningPosition(column.id, columnPinning),
      sortable: column.sortable,
      isSorted,
      sortDirection: isSorted ? sortEntry?.direction ?? null : null,
      sortIndex: isSorted ? sortIndex + 1 : null,
    };
  });
}
