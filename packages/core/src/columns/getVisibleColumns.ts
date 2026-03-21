import type {
  ColumnDef,
  ColumnVisibilityState,
} from "../types/index.js";

export function isColumnVisible(
  columnId: string,
  columnVisibility: ColumnVisibilityState | null | undefined,
): boolean {
  return columnVisibility?.[columnId] ?? true;
}

export function getVisibleColumns<TData>(
  columns: readonly ColumnDef<TData>[],
  columnVisibility: ColumnVisibilityState | null | undefined,
): ColumnDef<TData>[] {
  return columns.filter((column) => isColumnVisible(column.id, columnVisibility));
}
