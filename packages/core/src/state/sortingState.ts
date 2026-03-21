import type {
  SortDescriptor,
  SortingState,
  SortingStateInput,
} from "../types/index.js";

export function normalizeSortingState<TData>(
  sorting: SortingStateInput<TData> | undefined,
): SortDescriptor<TData>[] {
  if (!sorting) {
    return [];
  }

  return Array.isArray(sorting) ? [...sorting] : [sorting];
}

export function toSortingState<TData>(
  sorting: readonly SortDescriptor<TData>[],
): SortingState<TData> {
  return sorting.length > 0 ? [...sorting] : null;
}
