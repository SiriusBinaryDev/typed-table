import type { PartialTableState, TableState } from "../types/index.js";

import { normalizeGroupingState } from "./groupingState.js";
import { normalizeSortingState, toSortingState } from "./sortingState.js";

export const defaultTableState: TableState = {
  pagination: {
    page: 0,
    pageSize: 10,
  },
  sorting: null,
  filters: {},
  rowSelection: {},
  columnVisibility: {},
  columnOrder: [],
  rowOrder: [],
  columnPinning: {},
  columnSizing: {},
  grouping: [],
  rowExpansion: {},
  loading: false,
  error: null,
};

export function createTableState(initialState: PartialTableState = {}): TableState {
  return {
    pagination: {
      page: initialState.pagination?.page ?? defaultTableState.pagination.page,
      pageSize:
        initialState.pagination?.pageSize ?? defaultTableState.pagination.pageSize,
    },
    sorting: toSortingState(normalizeSortingState(initialState.sorting)),
    filters: initialState.filters ?? defaultTableState.filters,
    rowSelection: initialState.rowSelection ?? defaultTableState.rowSelection,
    columnVisibility:
      initialState.columnVisibility ?? defaultTableState.columnVisibility,
    columnOrder: initialState.columnOrder ?? defaultTableState.columnOrder,
    rowOrder: initialState.rowOrder ?? defaultTableState.rowOrder,
    columnPinning: initialState.columnPinning ?? defaultTableState.columnPinning,
    columnSizing: initialState.columnSizing ?? defaultTableState.columnSizing,
    grouping: normalizeGroupingState(initialState.grouping),
    rowExpansion: initialState.rowExpansion ?? defaultTableState.rowExpansion,
    loading: initialState.loading ?? defaultTableState.loading,
    error: initialState.error ?? defaultTableState.error,
  };
}
