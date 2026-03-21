import type { ColumnDef, FiltersState } from "../types/index.js";

function isInactiveFilter(value: unknown): boolean {
  return value == null || value === "";
}

function defaultFilter(value: unknown, filterValue: unknown): boolean {
  if (typeof value === "string" && typeof filterValue === "string") {
    return value.toLowerCase().includes(filterValue.toLowerCase());
  }

  if (Array.isArray(value)) {
    return value.includes(filterValue);
  }

  return Object.is(value, filterValue);
}

export function applyFilters<TData>(
  data: readonly TData[],
  filters: FiltersState,
  columns: readonly ColumnDef<TData>[],
): TData[] {
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => !isInactiveFilter(value),
  );

  if (activeFilters.length === 0) {
    return [...data];
  }

  return data.filter((row) =>
    activeFilters.every(([columnId, filterValue]) => {
      const column = columns.find((entry) => entry.id === columnId);

      if (!column) {
        return true;
      }

      const value = column.accessor(row);

      if (column.filterFn) {
        return column.filterFn(value, filterValue, row);
      }

      return defaultFilter(value, filterValue);
    }),
  );
}

