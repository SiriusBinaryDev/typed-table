import type {
  ColumnDef,
  ColumnId,
  FacetMinMaxValues,
  FiltersState,
} from "../types/index.js";

import { applyFilters } from "./applyFilters.js";

function omitColumnFilter<TData>(
  filters: FiltersState,
  columnId: ColumnId<TData>,
): FiltersState {
  if (!Object.prototype.hasOwnProperty.call(filters, columnId)) {
    return filters;
  }

  const nextFilters = { ...filters };

  delete nextFilters[columnId];

  return nextFilters;
}

function visitNumericValues(
  value: unknown,
  visitor: (numericValue: number) => void,
): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      visitNumericValues(entry, visitor);
    }

    return;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    visitor(value);
  }
}

export function getFacetedMinMaxValues<TData>(
  data: readonly TData[],
  columnId: ColumnId<TData>,
  columns: readonly ColumnDef<TData>[],
  filters: FiltersState,
): FacetMinMaxValues {
  const column = columns.find((entry) => entry.id === columnId);

  if (!column) {
    return null;
  }

  const facetedRows = applyFilters(
    data,
    omitColumnFilter(filters, columnId),
    columns,
  );
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let found = false;

  for (const row of facetedRows) {
    visitNumericValues(column.accessor(row), (numericValue) => {
      found = true;
      min = Math.min(min, numericValue);
      max = Math.max(max, numericValue);
    });
  }

  return found ? { min, max } : null;
}
