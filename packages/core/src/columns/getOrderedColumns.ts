import type {
  ColumnDef,
  ColumnOrderState,
  ColumnPinningPosition,
  ColumnPinningState,
} from "../types/index.js";

export function getColumnPinningPosition(
  columnId: string,
  columnPinning: ColumnPinningState | null | undefined,
): ColumnPinningPosition | null {
  return columnPinning?.[columnId] ?? null;
}

export function getOrderedColumnIds<TColumnId extends string>(
  columnIds: readonly TColumnId[],
  columnOrder: ColumnOrderState | null | undefined,
): TColumnId[] {
  const remainingColumnIds = new Map(columnIds.map((columnId) => [columnId, columnId]));
  const orderedColumnIds: TColumnId[] = [];

  for (const columnId of columnOrder ?? []) {
    const matchingColumnId = remainingColumnIds.get(columnId as TColumnId);

    if (!matchingColumnId) {
      continue;
    }

    orderedColumnIds.push(matchingColumnId);
    remainingColumnIds.delete(columnId as TColumnId);
  }

  return [...orderedColumnIds, ...remainingColumnIds.values()];
}

export function getOrderedColumns<TData>(
  columns: readonly ColumnDef<TData>[],
  columnOrder: ColumnOrderState | null | undefined,
  columnPinning: ColumnPinningState | null | undefined,
): ColumnDef<TData>[] {
  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const baseOrder = getOrderedColumnIds(
    columns.map((column) => column.id),
    columnOrder,
  );
  const leftColumns: ColumnDef<TData>[] = [];
  const centerColumns: ColumnDef<TData>[] = [];
  const rightColumns: ColumnDef<TData>[] = [];

  for (const columnId of baseOrder) {
    const column = columnsById.get(columnId);

    if (!column) {
      continue;
    }

    const pin = getColumnPinningPosition(column.id, columnPinning);

    if (pin === "left") {
      leftColumns.push(column);
      continue;
    }

    if (pin === "right") {
      rightColumns.push(column);
      continue;
    }

    centerColumns.push(column);
  }

  return [...leftColumns, ...centerColumns, ...rightColumns];
}
