import type {
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  SortingState,
  TableHeader,
} from "../types/index.js";

import { getColumnSizingInfo } from "../columns/getColumnSizing.js";
import { getColumnPinningPosition } from "../columns/getOrderedColumns.js";

export function createHeaders<TData>(
  columns: readonly ColumnDef<TData>[],
  sorting: SortingState<TData>,
  columnPinning?: ColumnPinningState | null,
  columnSizing?: ColumnSizingState | null,
): TableHeader[] {
  return columns.map((column) => {
    const sortIndex = sorting?.findIndex((entry) => entry.columnId === column.id) ?? -1;
    const sortEntry = sortIndex >= 0 ? sorting?.[sortIndex] : undefined;
    const isSorted = sortIndex >= 0;
    const { size, minSize, maxSize, canResize } = getColumnSizingInfo(
      column,
      columnSizing,
    );

    return {
      id: column.id,
      label: column.header,
      pin: getColumnPinningPosition(column.id, columnPinning),
      size,
      minSize,
      maxSize,
      canResize,
      sortable: column.sortable,
      isSorted,
      sortDirection: isSorted ? sortEntry?.direction ?? null : null,
      sortIndex: isSorted ? sortIndex + 1 : null,
    };
  });
}
