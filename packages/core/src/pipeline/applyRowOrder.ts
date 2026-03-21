import type { GetRowId, RowOrderState } from "../types/index.js";

export function applyRowOrder<TData>(
  data: readonly TData[],
  rowOrder: RowOrderState | null | undefined,
  getRowId: GetRowId<TData> | null | undefined,
): TData[] {
  if (!getRowId || !rowOrder || rowOrder.length === 0) {
    return [...data];
  }

  const remainingRows = new Map(
    data.map((row, index) => [getRowId(row, index), row] as const),
  );
  const orderedRows: TData[] = [];

  for (const rowId of rowOrder) {
    const row = remainingRows.get(rowId);

    if (row === undefined) {
      continue;
    }

    orderedRows.push(row);
    remainingRows.delete(rowId);
  }

  return [...orderedRows, ...remainingRows.values()];
}
