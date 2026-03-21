import type {
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  GetRowId,
  RemoteDataRowInput,
  RemoteGroupRowInput,
  RemoteRowInput,
  RowExpansionState,
  RowSelectionState,
  TableCell,
  TableRow,
} from "../types/index.js";

import { getColumnSizingInfo } from "../columns/getColumnSizing.js";
import { getColumnPinningPosition } from "../columns/getOrderedColumns.js";
import { isRowExpanded } from "../state/groupingState.js";

type CreateRemoteGroupedRowsOptions<TData> = {
  allColumns: readonly ColumnDef<TData>[];
  visibleColumns: readonly ColumnDef<TData>[];
  columnPinning?: ColumnPinningState | undefined;
  columnSizing?: ColumnSizingState | undefined;
  rowSelection?: RowSelectionState | undefined;
  rowExpansion?: RowExpansionState | undefined;
  getRowId?: GetRowId<TData> | undefined;
};

export type RemoteGroupedRowsResult<TData> = {
  rootRows: TableRow<TData>[];
  rows: TableRow<TData>[];
  totalRows: number;
};

function createDataRowCells<TData>(
  original: TData,
  rowId: string,
  columns: readonly ColumnDef<TData>[],
  columnPinning: ColumnPinningState | undefined,
  columnSizing: ColumnSizingState | undefined,
): TableCell<TData>[] {
  return columns.map<TableCell<TData>>((column) => {
    const value = column.accessor(original);
    const { size, minSize, maxSize, canResize } = getColumnSizingInfo(
      column,
      columnSizing,
    );

    return {
      id: `${rowId}:${column.id}`,
      columnId: column.id,
      pin: getColumnPinningPosition(column.id, columnPinning),
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
}

function createGroupRowCells<TData>(
  rowId: string,
  columns: readonly ColumnDef<TData>[],
  groupingColumnId: string,
  groupingValue: unknown,
  columnPinning: ColumnPinningState | undefined,
  columnSizing: ColumnSizingState | undefined,
): TableCell<TData>[] {
  return columns.map<TableCell<TData>>((column) => {
    const value = column.id === groupingColumnId ? groupingValue : null;
    const { size, minSize, maxSize, canResize } = getColumnSizingInfo(
      column,
      columnSizing,
    );

    return {
      id: `${rowId}:${column.id}`,
      columnId: column.id,
      pin: getColumnPinningPosition(column.id, columnPinning),
      size,
      minSize,
      maxSize,
      canResize,
      value,
      render: () => value,
    };
  });
}

function countLeafRows<TData>(rows: readonly TableRow<TData>[]): number {
  return rows.reduce((total, row) => total + row.leafRowCount, 0);
}

function flattenVisibleRows<TData>(rows: readonly TableRow<TData>[]): TableRow<TData>[] {
  const visibleRows: TableRow<TData>[] = [];

  for (const row of rows) {
    visibleRows.push(row);

    if (row.type === "group" && row.isExpanded) {
      visibleRows.push(...flattenVisibleRows(row.subRows));
    }
  }

  return visibleRows;
}

function isRemoteDataRowInput<TData>(
  row: RemoteRowInput<TData>,
): row is RemoteDataRowInput<TData> {
  return row.type !== "group";
}

export function createRemoteGroupedRows<TData>(
  groupedRows: readonly RemoteRowInput<TData>[],
  options: CreateRemoteGroupedRowsOptions<TData>,
): RemoteGroupedRowsResult<TData> {
  let leafIndex = 0;

  const buildRows = (
    entries: readonly RemoteRowInput<TData>[],
    depth: number,
    parentId: string | null,
  ): TableRow<TData>[] =>
    entries.map((entry) => {
      if (isRemoteDataRowInput(entry)) {
        const rowId = entry.id ?? options.getRowId?.(entry.original, leafIndex) ?? String(leafIndex);

        leafIndex += 1;

        return {
          id: rowId,
          type: "data",
          original: entry.original,
          parentId,
          depth,
          isSelected: options.rowSelection?.[rowId] ?? false,
          canExpand: false,
          isExpanded: false,
          groupingColumnId: null,
          groupingValue: null,
          leafRowCount: 1,
          subRows: [],
          cells: createDataRowCells(
            entry.original,
            rowId,
            options.visibleColumns,
            options.columnPinning,
            options.columnSizing,
          ),
        };
      }

      const groupEntry = entry as RemoteGroupRowInput<TData>;
      const subRows = buildRows(groupEntry.subRows ?? [], depth + 1, groupEntry.id);
      const leafRowCount = groupEntry.leafRowCount ?? countLeafRows(subRows);
      const canExpand = leafRowCount > 0;
      const isExpanded =
        canExpand &&
        subRows.length > 0 &&
        isRowExpanded(groupEntry.id, options.rowExpansion);

      return {
        id: groupEntry.id,
        type: "group",
        original: null,
        parentId,
        depth,
        isSelected: false,
        canExpand,
        isExpanded,
        groupingColumnId: groupEntry.groupingColumnId,
        groupingValue: groupEntry.groupingValue,
        leafRowCount,
        subRows,
        cells: createGroupRowCells(
          groupEntry.id,
          options.visibleColumns,
          groupEntry.groupingColumnId,
          groupEntry.groupingValue,
          options.columnPinning,
          options.columnSizing,
        ),
      };
    });

  const rootRows = buildRows(groupedRows, 0, null);
  const rows = flattenVisibleRows(rootRows);

  return {
    rootRows,
    rows,
    totalRows: rows.length,
  };
}

