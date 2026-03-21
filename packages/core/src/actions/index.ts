import type {
  ColumnDef,
  ColumnId,
  ColumnOrderState,
  ColumnPinningPosition,
  ColumnSizingState,
  FiltersState,
  GroupingState,
  PaginationState,
  RowSelectionState,
  SortByOptions,
  SortingState,
  SortingStateInput,
  TableState,
} from "../types/index.js";

import { getColumnSizingInfo } from "../columns/getColumnSizing.js";
import { getOrderedColumnIds } from "../columns/getOrderedColumns.js";
import { isRowExpanded, normalizeGroupingState } from "../state/groupingState.js";
import { normalizeSortingState, toSortingState } from "../state/sortingState.js";

function normalizePage(page: number): number {
  return Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0;
}

function normalizePageSize(pageSize: number): number {
  return Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1;
}

function isColumnVisible(state: TableState, columnId: string): boolean {
  return state.columnVisibility[columnId] ?? true;
}

function normalizeColumnOrder(columnOrder: readonly string[]): ColumnOrderState {
  const seenColumnIds = new Set<string>();
  const normalizedColumnOrder: string[] = [];

  for (const columnId of columnOrder) {
    if (seenColumnIds.has(columnId)) {
      continue;
    }

    seenColumnIds.add(columnId);
    normalizedColumnOrder.push(columnId);
  }

  return normalizedColumnOrder;
}

export function setPage(state: TableState, page: number): TableState {
  return {
    ...state,
    pagination: {
      ...state.pagination,
      page: normalizePage(page),
    },
  };
}

export function setPageSize(state: TableState, pageSize: number): TableState {
  return {
    ...state,
    pagination: {
      page: 0,
      pageSize: normalizePageSize(pageSize),
    },
  };
}

export function setSorting<TData>(
  state: TableState,
  sorting: SortingStateInput<TData>,
): TableState {
  return {
    ...state,
    pagination: {
      ...state.pagination,
      page: 0,
    },
    sorting: toSortingState(normalizeSortingState(sorting)),
  };
}

export function toggleSorting<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
  options: SortByOptions = {},
): TableState {
  const currentSorting = normalizeSortingState(state.sorting as SortingState<TData>);
  const existingIndex = currentSorting.findIndex((entry) => entry.columnId === columnId);
  const existingEntry = existingIndex >= 0 ? currentSorting[existingIndex] : undefined;

  if (!options.multi) {
    if (!existingEntry || currentSorting.length > 1) {
      return setSorting(state, { columnId, direction: "asc" });
    }

    if (existingEntry.direction === "asc") {
      return setSorting(state, { columnId, direction: "desc" });
    }

    return setSorting(state, null);
  }

  if (!existingEntry) {
    return setSorting(state, [...currentSorting, { columnId, direction: "asc" }]);
  }

  if (existingEntry.direction === "asc") {
    const nextSorting = [...currentSorting];
    nextSorting[existingIndex] = { columnId, direction: "desc" };

    return setSorting(state, nextSorting);
  }

  return setSorting(
    state,
    currentSorting.filter((entry) => entry.columnId !== columnId),
  );
}

export function clearSorting(state: TableState): TableState {
  return setSorting(state, null);
}

export function clearSortingColumn<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
): TableState {
  const currentSorting = normalizeSortingState(state.sorting as SortingState<TData>);

  return setSorting(
    state,
    currentSorting.filter((entry) => entry.columnId !== columnId),
  );
}

export function setFilter<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
  value: unknown,
): TableState {
  return {
    ...state,
    pagination: {
      ...state.pagination,
      page: 0,
    },
    filters: {
      ...state.filters,
      [columnId]: value,
    },
  };
}

export function clearFilter<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
): TableState {
  const nextFilters: FiltersState = { ...state.filters };
  delete nextFilters[columnId];

  return {
    ...state,
    pagination: {
      ...state.pagination,
      page: 0,
    },
    filters: nextFilters,
  };
}

export function clearFilters(state: TableState): TableState {
  return {
    ...state,
    pagination: {
      ...state.pagination,
      page: 0,
    },
    filters: {},
  };
}

export function setColumnVisibility<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
  visible: boolean,
): TableState {
  const nextColumnVisibility = { ...state.columnVisibility };

  if (visible) {
    delete nextColumnVisibility[columnId];
  } else {
    nextColumnVisibility[columnId] = false;
  }

  return {
    ...state,
    columnVisibility: nextColumnVisibility,
  };
}

export function toggleColumnVisibility<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
): TableState {
  return setColumnVisibility(state, columnId, !isColumnVisible(state, columnId));
}

export function clearColumnVisibility(state: TableState): TableState {
  return {
    ...state,
    columnVisibility: {},
  };
}

export function setGrouping<TData>(
  state: TableState,
  grouping: GroupingState<TData>,
): TableState {
  return {
    ...state,
    pagination: {
      ...state.pagination,
      page: 0,
    },
    grouping: normalizeGroupingState(grouping),
    rowExpansion: {},
  };
}

export function toggleGrouping<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
): TableState {
  const isGrouped = state.grouping.includes(columnId);

  return setGrouping(
    state,
    isGrouped
      ? state.grouping.filter((entry) => entry !== columnId)
      : [...state.grouping, columnId],
  );
}

export function clearGrouping(state: TableState): TableState {
  return setGrouping(state, []);
}

export function setColumnOrder<TData>(
  state: TableState,
  columnOrder: ColumnId<TData>[],
): TableState {
  return {
    ...state,
    columnOrder: normalizeColumnOrder(columnOrder),
  };
}

export function moveColumn<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
  targetIndex: number,
  availableColumnIds: readonly ColumnId<TData>[],
): TableState {
  const currentOrder = getOrderedColumnIds(availableColumnIds, state.columnOrder);
  const nextOrder = currentOrder.filter((entry) => entry !== columnId);
  const normalizedTargetIndex = Math.min(
    Math.max(Math.floor(targetIndex), 0),
    nextOrder.length,
  );

  nextOrder.splice(normalizedTargetIndex, 0, columnId);

  return setColumnOrder(state, nextOrder);
}

export function clearColumnOrder(state: TableState): TableState {
  return {
    ...state,
    columnOrder: [],
  };
}

export function setColumnPinning<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
  position: ColumnPinningPosition | null,
): TableState {
  const nextColumnPinning = { ...state.columnPinning };

  if (!position) {
    delete nextColumnPinning[columnId];
  } else {
    nextColumnPinning[columnId] = position;
  }

  return {
    ...state,
    columnPinning: nextColumnPinning,
  };
}

export function clearColumnPinning(state: TableState): TableState {
  return {
    ...state,
    columnPinning: {},
  };
}

function getColumnDefinition<TData>(
  columns: readonly ColumnDef<TData>[],
  columnId: ColumnId<TData>,
): ColumnDef<TData> | null {
  return columns.find((column) => column.id === columnId) ?? null;
}

export function setColumnSize<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
  size: number,
  columns: readonly ColumnDef<TData>[],
): TableState {
  const column = getColumnDefinition(columns, columnId);

  if (!column) {
    return state;
  }

  const { baseSize, minSize, maxSize } = getColumnSizingInfo(column);
  const nextColumnSizing: ColumnSizingState = { ...state.columnSizing };

  if (!Number.isFinite(size)) {
    delete nextColumnSizing[columnId];
  } else {
    const normalizedSize = Math.max(
      minSize,
      maxSize == null ? Math.floor(size) : Math.min(Math.floor(size), maxSize),
    );

    if (normalizedSize === baseSize) {
      delete nextColumnSizing[columnId];
    } else {
      nextColumnSizing[columnId] = normalizedSize;
    }
  }

  return {
    ...state,
    columnSizing: nextColumnSizing,
  };
}

export function resizeColumn<TData>(
  state: TableState,
  columnId: ColumnId<TData>,
  delta: number,
  columns: readonly ColumnDef<TData>[],
): TableState {
  const column = getColumnDefinition(columns, columnId);

  if (!column) {
    return state;
  }

  const { size } = getColumnSizingInfo(column, state.columnSizing);

  return setColumnSize(state, columnId, size + delta, columns);
}

export function clearColumnSizing(state: TableState): TableState {
  return {
    ...state,
    columnSizing: {},
  };
}

export function setRowExpanded(
  state: TableState,
  rowId: string,
  expanded: boolean,
): TableState {
  const nextRowExpansion = { ...state.rowExpansion };

  if (expanded) {
    delete nextRowExpansion[rowId];
  } else {
    nextRowExpansion[rowId] = false;
  }

  return {
    ...state,
    rowExpansion: nextRowExpansion,
  };
}

export function toggleRowExpanded(state: TableState, rowId: string): TableState {
  return setRowExpanded(state, rowId, !isRowExpanded(rowId, state.rowExpansion));
}

export function clearRowExpansion(state: TableState): TableState {
  return {
    ...state,
    rowExpansion: {},
  };
}

export function toggleRowSelection(
  state: TableState,
  rowId: string,
): TableState {
  const nextRowSelection: RowSelectionState = {
    ...state.rowSelection,
    [rowId]: !state.rowSelection[rowId],
  };

  if (!nextRowSelection[rowId]) {
    delete nextRowSelection[rowId];
  }

  return {
    ...state,
    rowSelection: nextRowSelection,
  };
}

export function clearRowSelection(state: TableState): TableState {
  return {
    ...state,
    rowSelection: {},
  };
}

export function setAsyncState(
  state: TableState,
  asyncState: { loading?: boolean; error?: Error | null },
): TableState {
  return {
    ...state,
    loading:
      "loading" in asyncState ? asyncState.loading ?? state.loading : state.loading,
    error: "error" in asyncState ? asyncState.error ?? null : state.error,
  };
}

export function setPagination(
  state: TableState,
  pagination: Partial<PaginationState>,
): TableState {
  return {
    ...state,
    pagination: {
      page: normalizePage(pagination.page ?? state.pagination.page),
      pageSize: normalizePageSize(
        pagination.pageSize ?? state.pagination.pageSize,
      ),
    },
  };
}
