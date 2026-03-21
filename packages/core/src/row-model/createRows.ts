import type {
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  GetRowId,
  RowSelectionState,
  TableCell,
  TableRow,
} from "../types/index.js";

import { getColumnSizingInfo } from "../columns/getColumnSizing.js";
import { getColumnPinningPosition } from "../columns/getOrderedColumns.js";

type CreateRowsOptions<TData> = {
  columns: readonly ColumnDef<TData>[];
  columnPinning?: ColumnPinningState | undefined;
  columnSizing?: ColumnSizingState | undefined;
  rowSelection?: RowSelectionState | undefined;
  getRowId?: GetRowId<TData> | undefined;
};

export function createRows<TData>(
  data: readonly TData[],
  options: CreateRowsOptions<TData>,
): TableRow<TData>[] {
  return data.map((original, index) => {
    const rowId = options.getRowId?.(original, index) ?? String(index);
    const cells = options.columns.map<TableCell<TData>>((column) => {
      const value = column.accessor(original);
      const { size, minSize, maxSize, canResize } = getColumnSizingInfo(
        column,
        options.columnSizing,
      );

      return {
        id: `${rowId}:${column.id}`,
        columnId: column.id,
        pin: getColumnPinningPosition(column.id, options.columnPinning),
        size,
        minSize,
        maxSize,
        canResize,
        value,
        render: () =>
          column.cell
            ? column.cell({ value, row: original, column })
            : value,
      };
    });

    return {
      id: rowId,
      type: "data",
      original,
      parentId: null,
      depth: 0,
      isSelected: options.rowSelection?.[rowId] ?? false,
      canExpand: false,
      isExpanded: false,
      groupingColumnId: null,
      groupingValue: null,
      leafRowCount: 1,
      subRows: [],
      cells,
    };
  });
}
