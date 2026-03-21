import { useEffect, useEffectEvent, useRef, useState } from "react";

import {
  clearColumnOrder as clearColumnOrderAction,
  clearColumnPinning as clearColumnPinningAction,
  clearColumnSizing as clearColumnSizingAction,
  clearColumnVisibility as clearColumnVisibilityAction,
  clearFilter as clearFilterAction,
  clearFilters as clearFiltersAction,
  clearGrouping as clearGroupingAction,
  clearRowExpansion as clearRowExpansionAction,
  clearRowOrder as clearRowOrderAction,
  clearRowSelection as clearRowSelectionAction,
  clearSorting as clearSortingAction,
  clearSortingColumn as clearSortingColumnAction,
  createHeaders,
  createTableState,
  getColumnPinningPosition,
  getColumnSizingInfo,
  getFacetedMinMaxValues as getFacetedMinMaxValuesHelper,
  getFacetedUniqueValues as getFacetedUniqueValuesHelper,
  getOrderedColumns,
  getVisibleColumns,
  moveColumn as moveColumnAction,
  moveRow as moveRowAction,
  normalizeGroupingState,
  resizeColumn as resizeColumnAction,
  normalizeSortingState,
  setRowOrder as setRowOrderAction,
  setColumnOrder as setColumnOrderAction,
  setColumnPinning as setColumnPinningAction,
  setColumnSize as setColumnSizeAction,
  setColumnVisibility as setColumnVisibilityAction,
  setFilter as setFilterAction,
  setGrouping as setGroupingAction,
  setPage as setPageAction,
  setPageSize as setPageSizeAction,
  setRowExpanded as setRowExpandedAction,
  setSorting as setSortingAction,
  toSortingState,
  toggleColumnVisibility as toggleColumnVisibilityAction,
  toggleGrouping as toggleGroupingAction,
  toggleRowExpanded as toggleRowExpandedAction,
  toggleRowSelection as toggleRowSelectionAction,
  toggleSorting as toggleSortingAction,
  type ColumnId,
  type ColumnPinningPosition,
  type FacetMinMaxValues,
  type FacetValueCount,
  type FiltersState,
  type GroupingState,
  type PaginationState,
  type RemoteLoadingMode,
  type RemoteRowSelectionController,
  type RemoteRowSelectionState,
  type SortByOptions,
  type SortingState,
  type SortingStateInput,
  type TableControlledState,
  type TableControlledStateInput,
  type TableInstance,
  type TableModel,
  type TableQuery,
  type TableRow,
  type TableState,
  type UseTableConfig,
} from "@typed-table/core";
import { createLocalAdapter, createRemoteAdapter } from "@typed-table/adapters";

const defaultRemoteRowSelectionState: RemoteRowSelectionState = {
  mode: "include",
  includedIds: [],
  excludedIds: [],
};

type RemoteSnapshot<TData> = {
  model: TableModel<TData>;
  pagination: PaginationState;
  sorting: SortingState<TData>;
  filters: FiltersState;
};

function isPositivePageCount(pageCount: number): boolean {
  return Number.isFinite(pageCount) && pageCount > 0;
}

function areSortingStatesEqual<TData>(
  left: SortingState<TData>,
  right: SortingState<TData>,
): boolean {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return left === right;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (entry, index) =>
      entry.columnId === right[index]?.columnId &&
      entry.direction === right[index]?.direction,
  );
}

function areFiltersEqual(left: FiltersState, right: FiltersState): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      Object.is(left[key], right[key]),
  );
}

function createSortingDependencyKey<TData>(sorting: SortingState<TData>): string {
  return JSON.stringify(sorting ?? []);
}

function createFiltersDependencyKey(filters: FiltersState): string {
  return JSON.stringify(
    Object.entries(filters).sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey),
    ),
  );
}

type RemoteRowSelectionScopeContext<TData> = {
  pagination: PaginationState;
  sorting: SortingState<TData>;
  filters: FiltersState;
};

function createRemoteRowSelectionScopeContext<TData>(
  state: TableState,
): RemoteRowSelectionScopeContext<TData> {
  return {
    pagination: { ...state.pagination },
    sorting: state.sorting as SortingState<TData>,
    filters: { ...state.filters },
  };
}

function createDefaultRemoteRowSelectionScopeKey<TData>(
  context: RemoteRowSelectionScopeContext<TData>,
): string {
  return JSON.stringify({
    pageSize: context.pagination.pageSize,
    sorting: context.sorting ?? [],
    filters: Object.entries(context.filters).sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey),
    ),
  });
}

function isRemoteRowSelectionCleared(rowSelection: RemoteRowSelectionState): boolean {
  return (
    rowSelection.mode === "include" &&
    rowSelection.includedIds.length === 0 &&
    rowSelection.excludedIds.length === 0
  );
}

function shouldAppendRemoteSnapshot<TData>(
  previous: RemoteSnapshot<TData> | null,
  next: RemoteSnapshot<TData>,
  remoteLoadingMode: RemoteLoadingMode,
): boolean {
  if (remoteLoadingMode !== "append" || !previous) {
    return false;
  }

  return (
    next.pagination.page > 0 &&
    next.pagination.page === previous.pagination.page + 1 &&
    next.pagination.pageSize === previous.pagination.pageSize &&
    areSortingStatesEqual(previous.sorting, next.sorting) &&
    areFiltersEqual(previous.filters, next.filters)
  );
}

function mergeRemoteRows<TData>(
  previousRows: TableRow<TData>[],
  nextRows: TableRow<TData>[],
): TableRow<TData>[] {
  const mergedRows = [...previousRows];
  const rowIndexById = new Map(mergedRows.map((row, index) => [row.id, index]));

  for (const row of nextRows) {
    const existingIndex = rowIndexById.get(row.id);

    if (existingIndex == null) {
      rowIndexById.set(row.id, mergedRows.length);
      mergedRows.push(row);
      continue;
    }

    mergedRows[existingIndex] = row;
  }

  return mergedRows;
}

function createRemoteSnapshot<TData>(
  model: TableModel<TData>,
  state: TableState,
): RemoteSnapshot<TData> {
  return {
    model,
    pagination: { ...state.pagination },
    sorting: state.sorting,
    filters: { ...state.filters },
  };
}

function createControlledStateSnapshot<TData>(
  state: TableState,
): TableControlledState<TData> {
  return {
    pagination: { ...state.pagination },
    sorting: state.sorting as SortingState<TData>,
    filters: { ...state.filters },
    rowSelection: { ...state.rowSelection },
    columnVisibility: { ...state.columnVisibility },
    columnOrder: [...state.columnOrder],
    rowOrder: [...state.rowOrder],
    columnPinning: { ...state.columnPinning },
    columnSizing: { ...state.columnSizing },
    grouping: [...state.grouping] as GroupingState<TData>,
    rowExpansion: { ...state.rowExpansion },
  };
}

function resolveTableState<TData>(
  internalState: TableState,
  controlledState: TableControlledStateInput<TData> | undefined,
): TableState {
  if (!controlledState) {
    return internalState;
  }

  return {
    ...internalState,
    pagination: controlledState.pagination
      ? { ...controlledState.pagination }
      : internalState.pagination,
    sorting:
      controlledState.sorting !== undefined
        ? toSortingState(normalizeSortingState(controlledState.sorting))
        : internalState.sorting,
    filters:
      controlledState.filters !== undefined
        ? controlledState.filters
        : internalState.filters,
    rowSelection:
      controlledState.rowSelection !== undefined
        ? controlledState.rowSelection
        : internalState.rowSelection,
    columnVisibility:
      controlledState.columnVisibility !== undefined
        ? controlledState.columnVisibility
        : internalState.columnVisibility,
    columnOrder:
      controlledState.columnOrder !== undefined
        ? [...controlledState.columnOrder]
        : internalState.columnOrder,
    rowOrder:
      controlledState.rowOrder !== undefined
        ? [...controlledState.rowOrder]
        : internalState.rowOrder,
    columnPinning:
      controlledState.columnPinning !== undefined
        ? controlledState.columnPinning
        : internalState.columnPinning,
    columnSizing:
      controlledState.columnSizing !== undefined
        ? controlledState.columnSizing
        : internalState.columnSizing,
    grouping:
      controlledState.grouping !== undefined
        ? normalizeGroupingState(controlledState.grouping)
        : internalState.grouping,
    rowExpansion:
      controlledState.rowExpansion !== undefined
        ? controlledState.rowExpansion
        : internalState.rowExpansion,
  };
}

function createRemoteRowSelectionState(
  rowSelection: TableState["rowSelection"] | undefined,
): RemoteRowSelectionState {
  const includedIds = Object.entries(rowSelection ?? {})
    .filter(([, isSelected]) => isSelected)
    .map(([rowId]) => rowId);

  return {
    mode: "include",
    includedIds,
    excludedIds: [],
  };
}

function isRemoteRowSelected(
  rowSelection: RemoteRowSelectionState,
  rowId: string,
): boolean {
  return rowSelection.mode === "all-except"
    ? !rowSelection.excludedIds.includes(rowId)
    : rowSelection.includedIds.includes(rowId);
}

function toggleRemoteRowSelection(
  rowSelection: RemoteRowSelectionState,
  rowId: string,
): RemoteRowSelectionState {
  if (rowSelection.mode === "all-except") {
    const isExcluded = rowSelection.excludedIds.includes(rowId);

    return {
      mode: "all-except",
      includedIds: [],
      excludedIds: isExcluded
        ? rowSelection.excludedIds.filter((entry) => entry !== rowId)
        : [...rowSelection.excludedIds, rowId],
    };
  }

  const isIncluded = rowSelection.includedIds.includes(rowId);

  return {
    mode: "include",
    includedIds: isIncluded
      ? rowSelection.includedIds.filter((entry) => entry !== rowId)
      : [...rowSelection.includedIds, rowId],
    excludedIds: [],
  };
}

function clearRemoteRowSelection(): RemoteRowSelectionState {
  return defaultRemoteRowSelectionState;
}

function selectAllRemoteRows(): RemoteRowSelectionState {
  return {
    mode: "all-except",
    includedIds: [],
    excludedIds: [],
  };
}

function getRemoteSelectedRowCount(
  rowSelection: RemoteRowSelectionState,
  totalRows: number,
): number {
  return rowSelection.mode === "all-except"
    ? Math.max(0, totalRows - rowSelection.excludedIds.length)
    : rowSelection.includedIds.length;
}

export function useTable<TData>(config: UseTableConfig<TData>): TableInstance<TData> {
  const sortingEnabled = config.features?.sorting ?? true;
  const filteringEnabled = config.features?.filtering ?? true;
  const paginationEnabled = config.features?.pagination ?? true;
  const rowSelectionEnabled = config.features?.rowSelection ?? true;
  const columnVisibilityEnabled = config.features?.columnVisibility ?? true;
  const columnOrderingEnabled = config.features?.columnOrdering ?? true;
  const isRemote = config.mode === "remote";
  const rowOrderingEnabled = !isRemote && (config.features?.rowOrdering ?? true) && !!config.getRowId;
  const columnPinningEnabled = config.features?.columnPinning ?? true;
  const columnResizingEnabled = config.features?.columnResizing ?? true;
  const groupingEnabled = config.features?.grouping ?? true;
  const rowExpansionEnabled = config.features?.rowExpansion ?? true;
  const remoteRowSelectionConfig = isRemote ? config.remoteRowSelection : undefined;
  const remoteLoadingMode: RemoteLoadingMode =
    isRemote ? config.remoteLoading?.mode ?? "replace" : "replace";
  const advancedRemoteRowSelectionEnabled =
    isRemote &&
    rowSelectionEnabled &&
    remoteRowSelectionConfig?.strategy === "all-except";
  const remoteRowSelectionResetOnQueryChange =
    advancedRemoteRowSelectionEnabled &&
    (remoteRowSelectionConfig?.resetOnQueryChange ?? false);
  const localData = isRemote ? undefined : config.data;
  const remoteQuery: TableQuery<TData> | null = isRemote ? config.query : null;
  const validColumnIds = new Set(config.columns.map((column) => column.id));
  const availableLocalRowIds = rowOrderingEnabled && localData
    ? localData.map((row, index) => config.getRowId!(row, index))
    : [];
  const validLocalRowIds = new Set(availableLocalRowIds);

  const [internalState, setInternalState] = useState<TableState>(() =>
    createTableState(config.initialState),
  );
  const [remoteAdvancedRowSelection, setRemoteAdvancedRowSelection] =
    useState<RemoteRowSelectionState>(() =>
      createRemoteRowSelectionState(config.initialState?.rowSelection),
    );
  const [remoteSnapshot, setRemoteSnapshot] = useState<RemoteSnapshot<TData> | null>(null);
  const state = resolveTableState(internalState, config.state);
  const sortingDependencyKey = createSortingDependencyKey(state.sorting);
  const filtersDependencyKey = createFiltersDependencyKey(state.filters);
  const remoteRowSelectionScopeContext = createRemoteRowSelectionScopeContext<TData>(state);
  const remoteRowSelectionScopeKey = advancedRemoteRowSelectionEnabled
    ? remoteRowSelectionConfig?.getQueryScopeKey?.(remoteRowSelectionScopeContext) ??
      createDefaultRemoteRowSelectionScopeKey(remoteRowSelectionScopeContext)
    : null;
  const previousRemoteRowSelectionScopeKeyRef = useRef<string | null>(null);

  function updateState(recipe: (current: TableState) => TableState): void {
    setInternalState((currentInternalState) => {
      const currentState = resolveTableState(currentInternalState, config.state);
      const nextState = recipe(currentState);

      config.onStateChange?.(createControlledStateSnapshot<TData>(nextState));

      return nextState;
    });
  }

  const resolveRemoteModel = useEffectEvent(
    async (currentState: TableState, signal?: AbortSignal) => {
      if (!remoteQuery) {
        throw new Error("Remote query is required in remote mode.");
      }

      return createRemoteAdapter({
        columns: config.columns,
        state: currentState,
        features: {
          sorting: sortingEnabled,
          filtering: filteringEnabled,
          pagination: paginationEnabled,
          rowSelection: rowSelectionEnabled,
          columnVisibility: false,
          columnOrdering: false,
          columnPinning: false,
          columnResizing: false,
          grouping: false,
          rowExpansion: false,
        },
        query: remoteQuery,
        ...(config.getRowId ? { getRowId: config.getRowId } : {}),
        ...(signal ? { signal } : {}),
      });
    },
  );

  useEffect(() => {
    if (advancedRemoteRowSelectionEnabled && remoteRowSelectionScopeKey != null) {
      if (!remoteRowSelectionResetOnQueryChange) {
        previousRemoteRowSelectionScopeKeyRef.current = remoteRowSelectionScopeKey;
      } else if (previousRemoteRowSelectionScopeKeyRef.current == null) {
        previousRemoteRowSelectionScopeKeyRef.current = remoteRowSelectionScopeKey;
      } else if (previousRemoteRowSelectionScopeKeyRef.current !== remoteRowSelectionScopeKey) {
        previousRemoteRowSelectionScopeKeyRef.current = remoteRowSelectionScopeKey;

        if (!isRemoteRowSelectionCleared(remoteAdvancedRowSelection)) {
          setRemoteAdvancedRowSelection(clearRemoteRowSelection());
        }
      }
    } else {
      previousRemoteRowSelectionScopeKeyRef.current = null;
    }
  }, [
    advancedRemoteRowSelectionEnabled,
    remoteAdvancedRowSelection,
    remoteRowSelectionResetOnQueryChange,
    remoteRowSelectionScopeKey,
  ]);

  useEffect(() => {
    if (!isRemote) {
      return;
    }

    let cancelled = false;
    const controller =
      typeof AbortController === "undefined"
        ? undefined
        : new AbortController();

    setInternalState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    void resolveRemoteModel(state, controller?.signal)
      .then((model) => {
        if (cancelled) {
          return;
        }

        const nextSnapshot = createRemoteSnapshot(model, state);

        setRemoteSnapshot((current) => {
          if (!shouldAppendRemoteSnapshot(current, nextSnapshot, remoteLoadingMode)) {
            return nextSnapshot;
          }

          return {
            ...nextSnapshot,
            model: {
              ...nextSnapshot.model,
              rows: mergeRemoteRows(current!.model.rows, nextSnapshot.model.rows),
            },
          };
        });
        setInternalState((current) => ({
          ...current,
          loading: false,
          error: null,
        }));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const normalizedError =
          error instanceof Error
            ? error
            : new Error("Failed to resolve remote table data.");

        setInternalState((current) => ({
          ...current,
          loading: false,
          error: normalizedError,
        }));
      });

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [
    config.columns,
    filteringEnabled,
    isRemote,
    paginationEnabled,
    remoteLoadingMode,
    rowSelectionEnabled,
    sortingEnabled,
    filtersDependencyKey,
    state.pagination.page,
    state.pagination.pageSize,
    sortingDependencyKey,
  ]);

  const visibleColumns = columnVisibilityEnabled
    ? getVisibleColumns(config.columns, state.columnVisibility)
    : [...config.columns];
  const orderedVisibleColumns = getOrderedColumns(
    visibleColumns,
    columnOrderingEnabled ? state.columnOrder : null,
    columnPinningEnabled ? state.columnPinning : null,
  );

  const localModel = !isRemote && localData
    ? createLocalAdapter({
        columns: config.columns,
        data: localData,
        state,
        features: {
          sorting: sortingEnabled,
          filtering: filteringEnabled,
          pagination: paginationEnabled,
          rowSelection: rowSelectionEnabled,
          columnVisibility: columnVisibilityEnabled,
          columnOrdering: columnOrderingEnabled,
          rowOrdering: rowOrderingEnabled,
          columnPinning: columnPinningEnabled,
          columnResizing: columnResizingEnabled,
          grouping: groupingEnabled,
          rowExpansion: rowExpansionEnabled,
        },
        ...(config.getRowId ? { getRowId: config.getRowId } : {}),
      })
    : null;

  const remoteModel: TableModel<TData> = remoteSnapshot?.model ?? {
    headers: createHeaders(
      config.columns,
      null,
      null,
      columnResizingEnabled ? state.columnSizing : null,
    ),
    rows: [],
    pageCount: 0,
    totalRows: 0,
  };

  const remoteRows = remoteModel.rows.map((row) => {
    const cellsByColumnId = new Map(row.cells.map((cell) => [cell.columnId, cell]));

    return {
      ...row,
      isSelected: advancedRemoteRowSelectionEnabled
        ? isRemoteRowSelected(remoteAdvancedRowSelection, row.id)
        : row.isSelected,
      cells: orderedVisibleColumns.flatMap((column) => {
        const cell = cellsByColumnId.get(column.id);
        const { size, minSize, maxSize, canResize } = getColumnSizingInfo(
          column,
          columnResizingEnabled ? state.columnSizing : null,
        );

        if (!cell) {
          return [];
        }

        return [
          {
            ...cell,
            pin: columnPinningEnabled
              ? getColumnPinningPosition(column.id, state.columnPinning)
              : null,
            size,
            minSize,
            maxSize,
            canResize,
          },
        ];
      }),
    };
  });

  const model: TableModel<TData> = isRemote
    ? {
        headers: createHeaders(
          orderedVisibleColumns,
          sortingEnabled ? state.sorting : null,
          columnPinningEnabled ? state.columnPinning : null,
          columnResizingEnabled ? state.columnSizing : null,
        ),
        rows: remoteRows,
        pageCount: paginationEnabled
          ? remoteModel.pageCount
          : remoteModel.totalRows > 0
            ? 1
            : 0,
        totalRows: remoteModel.totalRows,
      }
    : (localModel as TableModel<TData>);

  const pageCount = paginationEnabled ? model.pageCount : model.totalRows > 0 ? 1 : 0;
  const maxPage = isPositivePageCount(pageCount) ? pageCount - 1 : 0;
  const page = paginationEnabled ? Math.min(state.pagination.page, maxPage) : 0;
  const pageSize = paginationEnabled ? state.pagination.pageSize : model.totalRows || 0;
  const selectedRowIds = !rowSelectionEnabled
    ? []
    : advancedRemoteRowSelectionEnabled
      ? model.rows.filter((row) => row.isSelected).map((row) => row.id)
      : Object.entries(state.rowSelection)
          .filter(([, isSelected]) => isSelected)
          .map(([rowId]) => rowId);

  function setPage(pageValue: number): void {
    if (!paginationEnabled) {
      return;
    }

    updateState((current) =>
      setPageAction(current, Math.min(Math.max(pageValue, 0), maxPage)),
    );
  }

  function setPageSize(pageSizeValue: number): void {
    if (!paginationEnabled) {
      return;
    }

    updateState((current) => setPageSizeAction(current, pageSizeValue));
  }

  function nextPage(): void {
    setPage(page + 1);
  }

  function previousPage(): void {
    setPage(page - 1);
  }

  function sortBy(columnId: ColumnId<TData>, options?: SortByOptions): void {
    if (!sortingEnabled) {
      return;
    }

    const column = config.columns.find((entry) => entry.id === columnId);

    if (!column?.sortable) {
      return;
    }

    updateState((current) => toggleSortingAction(current, columnId, options));
  }

  function setSortingValue(nextSorting: SortingStateInput<TData>): void {
    if (!sortingEnabled) {
      return;
    }

    updateState((current) => setSortingAction(current, nextSorting));
  }

  function clearSorting(): void {
    if (!sortingEnabled) {
      return;
    }

    updateState((current) => clearSortingAction(current));
  }

  function clearSortingColumn(columnId: ColumnId<TData>): void {
    if (!sortingEnabled) {
      return;
    }

    updateState((current) => clearSortingColumnAction(current, columnId));
  }

  function setFilterValue(columnId: ColumnId<TData>, value: unknown): void {
    if (!filteringEnabled) {
      return;
    }

    updateState((current) => setFilterAction(current, columnId, value));
  }

  function clearFilter(columnId: ColumnId<TData>): void {
    if (!filteringEnabled) {
      return;
    }

    updateState((current) => clearFilterAction(current, columnId));
  }

  function clearFilters(): void {
    if (!filteringEnabled) {
      return;
    }

    updateState((current) => clearFiltersAction(current));
  }

  function getFacetedUniqueValuesValue(
    columnId: ColumnId<TData>,
  ): FacetValueCount[] {
    if (isRemote || !localData) {
      return [];
    }

    if (!validColumnIds.has(columnId)) {
      return [];
    }

    return getFacetedUniqueValuesHelper(
      localData,
      columnId,
      config.columns,
      state.filters,
    );
  }

  function getFacetedMinMaxValuesValue(
    columnId: ColumnId<TData>,
  ): FacetMinMaxValues {
    if (isRemote || !localData) {
      return null;
    }

    if (!validColumnIds.has(columnId)) {
      return null;
    }

    return getFacetedMinMaxValuesHelper(
      localData,
      columnId,
      config.columns,
      state.filters,
    );
  }

  function setColumnVisibilityValue(
    columnId: ColumnId<TData>,
    visible: boolean,
  ): void {
    if (!columnVisibilityEnabled) {
      return;
    }

    if (!validColumnIds.has(columnId)) {
      return;
    }

    updateState((current) => setColumnVisibilityAction(current, columnId, visible));
  }

  function toggleColumnVisibilityValue(columnId: ColumnId<TData>): void {
    if (!columnVisibilityEnabled) {
      return;
    }

    if (!validColumnIds.has(columnId)) {
      return;
    }

    updateState((current) => toggleColumnVisibilityAction(current, columnId));
  }

  function clearColumnVisibility(): void {
    if (!columnVisibilityEnabled) {
      return;
    }

    updateState((current) => clearColumnVisibilityAction(current));
  }

  function setGroupingValue(grouping: ColumnId<TData>[]): void {
    if (!groupingEnabled) {
      return;
    }

    updateState((current) =>
      setGroupingAction(
        current,
        grouping.filter((columnId) => validColumnIds.has(columnId)),
      ),
    );
  }

  function toggleGroupingValue(columnId: ColumnId<TData>): void {
    if (!groupingEnabled) {
      return;
    }

    if (!validColumnIds.has(columnId)) {
      return;
    }

    updateState((current) => toggleGroupingAction(current, columnId));
  }

  function clearGrouping(): void {
    if (!groupingEnabled) {
      return;
    }

    updateState((current) => clearGroupingAction(current));
  }

  function setColumnOrderValue(columnOrder: ColumnId<TData>[]): void {
    if (!columnOrderingEnabled) {
      return;
    }

    const nextColumnOrder = columnOrder.filter((columnId) => validColumnIds.has(columnId));

    updateState((current) => setColumnOrderAction(current, nextColumnOrder));
  }

  function moveColumnValue(columnId: ColumnId<TData>, targetIndex: number): void {
    if (!columnOrderingEnabled) {
      return;
    }

    if (!validColumnIds.has(columnId)) {
      return;
    }

    updateState((current) =>
      moveColumnAction(
        current,
        columnId,
        targetIndex,
        config.columns.map((column) => column.id),
      ),
    );
  }

  function clearColumnOrder(): void {
    if (!columnOrderingEnabled) {
      return;
    }

    updateState((current) => clearColumnOrderAction(current));
  }

  function setRowOrderValue(rowOrder: string[]): void {
    if (!rowOrderingEnabled) {
      return;
    }

    const nextRowOrder = rowOrder.filter((rowId) => validLocalRowIds.has(rowId));

    updateState((current) => setRowOrderAction(current, nextRowOrder));
  }

  function moveRowValue(rowId: string, targetIndex: number): void {
    if (!rowOrderingEnabled) {
      return;
    }

    if (!validLocalRowIds.has(rowId)) {
      return;
    }

    updateState((current) =>
      moveRowAction(current, rowId, targetIndex, availableLocalRowIds),
    );
  }

  function clearRowOrder(): void {
    if (!rowOrderingEnabled) {
      return;
    }

    updateState((current) => clearRowOrderAction(current));
  }

  function setColumnPinningValue(
    columnId: ColumnId<TData>,
    position: ColumnPinningPosition | null,
  ): void {
    if (!columnPinningEnabled) {
      return;
    }

    if (!validColumnIds.has(columnId)) {
      return;
    }

    updateState((current) => setColumnPinningAction(current, columnId, position));
  }

  function clearColumnPinning(): void {
    if (!columnPinningEnabled) {
      return;
    }

    updateState((current) => clearColumnPinningAction(current));
  }

  function setColumnSizeValue(columnId: ColumnId<TData>, size: number): void {
    if (!columnResizingEnabled) {
      return;
    }

    if (!validColumnIds.has(columnId)) {
      return;
    }

    updateState((current) => setColumnSizeAction(current, columnId, size, config.columns));
  }

  function resizeColumnValue(columnId: ColumnId<TData>, delta: number): void {
    if (!columnResizingEnabled) {
      return;
    }

    if (!validColumnIds.has(columnId)) {
      return;
    }

    updateState((current) => resizeColumnAction(current, columnId, delta, config.columns));
  }

  function clearColumnSizing(): void {
    if (!columnResizingEnabled) {
      return;
    }

    updateState((current) => clearColumnSizingAction(current));
  }

  function setRowExpandedValue(rowId: string, expanded: boolean): void {
    if (!groupingEnabled || !rowExpansionEnabled) {
      return;
    }

    const row = model.rows.find((entry) => entry.id === rowId);

    if (!row?.canExpand) {
      return;
    }

    updateState((current) => setRowExpandedAction(current, rowId, expanded));
  }

  function toggleRowExpandedValue(rowId: string): void {
    if (!groupingEnabled || !rowExpansionEnabled) {
      return;
    }

    const row = model.rows.find((entry) => entry.id === rowId);

    if (!row?.canExpand) {
      return;
    }

    updateState((current) => toggleRowExpandedAction(current, rowId));
  }

  function clearRowExpansion(): void {
    if (!groupingEnabled || !rowExpansionEnabled) {
      return;
    }

    updateState((current) => clearRowExpansionAction(current));
  }

  function selectAllMatchingRows(): void {
    if (!advancedRemoteRowSelectionEnabled) {
      return;
    }

    setRemoteAdvancedRowSelection(selectAllRemoteRows());
  }

  function toggleRowSelection(rowId: string): void {
    if (!rowSelectionEnabled) {
      return;
    }

    const row = model.rows.find((entry) => entry.id === rowId);

    if (row?.type === "group") {
      return;
    }

    if (advancedRemoteRowSelectionEnabled) {
      setRemoteAdvancedRowSelection((current) => toggleRemoteRowSelection(current, rowId));
      return;
    }

    updateState((current) => toggleRowSelectionAction(current, rowId));
  }

  function clearRowSelection(): void {
    if (!rowSelectionEnabled) {
      return;
    }

    if (advancedRemoteRowSelectionEnabled) {
      setRemoteAdvancedRowSelection(clearRemoteRowSelection());
      return;
    }

    updateState((current) => clearRowSelectionAction(current));
  }

  const remoteRowSelection: RemoteRowSelectionController | null =
    advancedRemoteRowSelectionEnabled
      ? {
          strategy: "all-except",
          state: remoteAdvancedRowSelection,
          allMatchingRowsSelected:
            remoteAdvancedRowSelection.mode === "all-except" &&
            remoteAdvancedRowSelection.excludedIds.length === 0 &&
            model.totalRows > 0,
          selectedRowCount: getRemoteSelectedRowCount(
            remoteAdvancedRowSelection,
            model.totalRows,
          ),
          selectAllMatchingRows,
        }
      : null;

  return {
    headers: model.headers,
    rows: model.rows,
    page,
    pageSize,
    pageCount,
    totalRows: model.totalRows,
    sorting: sortingEnabled ? state.sorting : null,
    filters: filteringEnabled ? state.filters : {},
    selectedRowIds,
    remoteRowSelection,
    columnVisibility: columnVisibilityEnabled ? state.columnVisibility : {},
    columnOrder: columnOrderingEnabled ? state.columnOrder : [],
    rowOrder: rowOrderingEnabled ? state.rowOrder : [],
    columnPinning: columnPinningEnabled ? state.columnPinning : {},
    columnSizing: columnResizingEnabled ? state.columnSizing : {},
    grouping: groupingEnabled ? state.grouping : [],
    rowExpansion: groupingEnabled && rowExpansionEnabled ? state.rowExpansion : {},
    loading: state.loading,
    error: state.error,
    canGoToNextPage: paginationEnabled && page < maxPage,
    canGoToPreviousPage: paginationEnabled && page > 0,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    sortBy,
    setSorting: setSortingValue,
    clearSorting,
    clearSortingColumn,
    setFilter: setFilterValue,
    clearFilter,
    clearFilters,
    getFacetedUniqueValues: getFacetedUniqueValuesValue,
    getFacetedMinMaxValues: getFacetedMinMaxValuesValue,
    setColumnVisibility: setColumnVisibilityValue,
    toggleColumnVisibility: toggleColumnVisibilityValue,
    clearColumnVisibility,
    setGrouping: setGroupingValue,
    toggleGrouping: toggleGroupingValue,
    clearGrouping,
    setColumnOrder: setColumnOrderValue,
    moveColumn: moveColumnValue,
    clearColumnOrder,
    setRowOrder: setRowOrderValue,
    moveRow: moveRowValue,
    clearRowOrder,
    setColumnPinning: setColumnPinningValue,
    clearColumnPinning,
    setColumnSize: setColumnSizeValue,
    resizeColumn: resizeColumnValue,
    clearColumnSizing,
    setRowExpanded: setRowExpandedValue,
    toggleRowExpanded: toggleRowExpandedValue,
    clearRowExpansion,
    toggleRowSelection,
    clearRowSelection,
  };
}







