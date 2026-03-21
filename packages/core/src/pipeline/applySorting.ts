import type { ColumnDef, SortingState } from "../types/index.js";

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return -1;
  }

  if (right == null) {
    return 1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  return String(left).localeCompare(String(right));
}

export function applySorting<TData>(
  data: readonly TData[],
  sorting: SortingState<TData>,
  columns: readonly ColumnDef<TData>[],
): TData[] {
  if (!sorting || sorting.length === 0) {
    return [...data];
  }

  const activeSorting = sorting
    .map((entry) => ({
      entry,
      column: columns.find((column) => column.id === entry.columnId),
    }))
    .filter(
      (
        candidate,
      ): candidate is {
        entry: NonNullable<SortingState<TData>>[number];
        column: ColumnDef<TData>;
      } => Boolean(candidate.column?.sortable),
    );

  if (activeSorting.length === 0) {
    return [...data];
  }

  return [...data].sort((leftRow, rightRow) => {
    for (const { entry, column } of activeSorting) {
      const leftValue = column.accessor(leftRow);
      const rightValue = column.accessor(rightRow);
      const direction = entry.direction === "asc" ? 1 : -1;
      const result = column.sortFn
        ? column.sortFn(leftValue, rightValue, leftRow, rightRow)
        : compareValues(leftValue, rightValue);

      if (result !== 0) {
        return result * direction;
      }
    }

    return 0;
  });
}
