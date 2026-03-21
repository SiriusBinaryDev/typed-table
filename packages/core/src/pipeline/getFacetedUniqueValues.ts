import type {
  ColumnDef,
  ColumnId,
  FacetValueCount,
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

function countFacetValue(
  counts: Map<unknown, number>,
  value: unknown,
): void {
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

function collectFacetValues(
  counts: Map<unknown, number>,
  value: unknown,
): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      countFacetValue(counts, entry);
    }

    return;
  }

  countFacetValue(counts, value);
}

export function getFacetedUniqueValues<TData>(
  data: readonly TData[],
  columnId: ColumnId<TData>,
  columns: readonly ColumnDef<TData>[],
  filters: FiltersState,
): FacetValueCount[] {
  const column = columns.find((entry) => entry.id === columnId);

  if (!column) {
    return [];
  }

  const facetedRows = applyFilters(
    data,
    omitColumnFilter(filters, columnId),
    columns,
  );
  const counts = new Map<unknown, number>();

  for (const row of facetedRows) {
    collectFacetValues(counts, column.accessor(row));
  }

  return Array.from(counts, ([value, count]) => ({
    value,
    count,
  }));
}
