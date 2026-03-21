import type {
  ColumnDef,
  ColumnId,
  ColumnPinningState,
  GetRowId,
  RowExpansionState,
  RowSelectionState,
  TableCell,
  TableRow,
} from "../types/index.js";

import { getColumnPinningPosition } from "../columns/getOrderedColumns.js";
import { isRowExpanded } from "../state/groupingState.js";

type CreateGroupedRowsOptions<TData> = {
  allColumns: readonly ColumnDef<TData>[];
  visibleColumns: readonly ColumnDef<TData>[];
  grouping: readonly ColumnId<TData>[];
  columnPinning?: ColumnPinningState | undefined;
  rowSelection?: RowSelectionState | undefined;
  rowExpansion?: RowExpansionState | undefined;
  getRowId?: GetRowId<TData> | undefined;
};

type PreparedLeafRow<TData> = {
  id: string;
  original: TData;
};

type GroupPathEntry = {
  columnId: string;
  value: unknown;
};

export type GroupedRowsResult<TData> = {
  rootRows: TableRow<TData>[];
  rows: TableRow<TData>[];
  totalRows: number;
};

function serializeGroupingValue(value: unknown): string {
  if (value == null) {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function createGroupRowId(path: readonly GroupPathEntry[]): string {
  return `group:${path
    .map((entry) => `${entry.columnId}=${serializeGroupingValue(entry.value)}`)
    .join("|")}`;
}

function createDataRowCells<TData>(
  original: TData,
  rowId: string,
  columns: readonly ColumnDef<TData>[],
  columnPinning: ColumnPinningState | undefined,
): TableCell<TData>[] {
  return columns.map<TableCell<TData>>((column) => {
    const value = column.accessor(original);

    return {
      id: `${rowId}:${column.id}`,
      columnId: column.id,
      pin: getColumnPinningPosition(column.id, columnPinning),
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
): TableCell<TData>[] {
  return columns.map<TableCell<TData>>((column) => {
    const value = column.id === groupingColumnId ? groupingValue : null;

    return {
      id: `${rowId}:${column.id}`,
      columnId: column.id,
      pin: getColumnPinningPosition(column.id, columnPinning),
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

export function createGroupedRows<TData>(
  data: readonly TData[],
  options: CreateGroupedRowsOptions<TData>,
): GroupedRowsResult<TData> {
  const columnMap = new Map(options.allColumns.map((column) => [column.id, column]));
  const groupingColumns = options.grouping.flatMap((columnId) => {
    const column = columnMap.get(columnId);

    return column ? [column] : [];
  });
  const preparedLeafRows = data.map<PreparedLeafRow<TData>>((original, index) => ({
    id: options.getRowId?.(original, index) ?? String(index),
    original,
  }));

  const buildRows = (
    entries: readonly PreparedLeafRow<TData>[],
    depth: number,
    parentId: string | null,
    path: readonly GroupPathEntry[],
  ): TableRow<TData>[] => {
    if (depth >= groupingColumns.length) {
      return entries.map((entry) => ({
        id: entry.id,
        type: "data",
        original: entry.original,
        parentId,
        depth,
        isSelected: options.rowSelection?.[entry.id] ?? false,
        canExpand: false,
        isExpanded: false,
        groupingColumnId: null,
        groupingValue: null,
        leafRowCount: 1,
        subRows: [],
        cells: createDataRowCells(
          entry.original,
          entry.id,
          options.visibleColumns,
          options.columnPinning,
        ),
      }));
    }

    const groupingColumn = groupingColumns[depth]!;
    const buckets = new Map<string, { value: unknown; entries: PreparedLeafRow<TData>[] }>();

    for (const entry of entries) {
      const value = groupingColumn.accessor(entry.original);
      const key = serializeGroupingValue(value);
      const existingBucket = buckets.get(key);

      if (existingBucket) {
        existingBucket.entries.push(entry);
        continue;
      }

      buckets.set(key, {
        value,
        entries: [entry],
      });
    }

    return [...buckets.values()].map((bucket) => {
      const groupPath = [...path, { columnId: groupingColumn.id, value: bucket.value }];
      const rowId = createGroupRowId(groupPath);
      const subRows = buildRows(bucket.entries, depth + 1, rowId, groupPath);

      return {
        id: rowId,
        type: "group",
        original: null,
        parentId,
        depth,
        isSelected: false,
        canExpand: subRows.length > 0,
        isExpanded: isRowExpanded(rowId, options.rowExpansion),
        groupingColumnId: groupingColumn.id,
        groupingValue: bucket.value,
        leafRowCount: countLeafRows(subRows),
        subRows,
        cells: createGroupRowCells(
          rowId,
          options.visibleColumns,
          groupingColumn.id,
          bucket.value,
          options.columnPinning,
        ),
      };
    });
  };

  const rootRows = buildRows(preparedLeafRows, 0, null, []);
  const rows = flattenVisibleRows(rootRows);

  return {
    rootRows,
    rows,
    totalRows: rows.length,
  };
}


