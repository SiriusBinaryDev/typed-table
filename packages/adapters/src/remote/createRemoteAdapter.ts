import {
  createHeaders,
  createRows,
  getOrderedColumns,
  getPageCount,
  getVisibleColumns,
  type RemoteAdapterInput,
  type TableModel,
} from "@typed-table/core";

export async function createRemoteAdapter<TData>(
  input: RemoteAdapterInput<TData>,
): Promise<TableModel<TData>> {
  const filteringEnabled = input.features?.filtering ?? true;
  const sortingEnabled = input.features?.sorting ?? true;
  const paginationEnabled = input.features?.pagination ?? true;
  const rowSelectionEnabled = input.features?.rowSelection ?? true;
  const columnVisibilityEnabled = input.features?.columnVisibility ?? true;
  const columnOrderingEnabled = input.features?.columnOrdering ?? true;
  const columnPinningEnabled = input.features?.columnPinning ?? true;
  const visibleColumns = columnVisibilityEnabled
    ? getVisibleColumns(input.columns, input.state.columnVisibility)
    : [...input.columns];
  const orderedVisibleColumns = getOrderedColumns(
    visibleColumns,
    columnOrderingEnabled ? input.state.columnOrder : null,
    columnPinningEnabled ? input.state.columnPinning : null,
  );

  const result = await input.query({
    pagination: input.state.pagination,
    sorting: sortingEnabled ? input.state.sorting : null,
    filters: filteringEnabled ? input.state.filters : {},
    ...(input.signal ? { signal: input.signal } : {}),
  });

  const getRowId = input.getRowId
    ? input.getRowId
    : (_row: TData, index: number) =>
        String(input.state.pagination.page * input.state.pagination.pageSize + index);

  return {
    headers: createHeaders(
      orderedVisibleColumns,
      sortingEnabled ? input.state.sorting : null,
      columnPinningEnabled ? input.state.columnPinning : null,
    ),
    rows: createRows(result.rows, {
      columns: orderedVisibleColumns,
      columnPinning: columnPinningEnabled ? input.state.columnPinning : undefined,
      rowSelection: rowSelectionEnabled ? input.state.rowSelection : {},
      getRowId,
    }),
    pageCount: paginationEnabled
      ? getPageCount(result.total, input.state.pagination.pageSize)
      : result.total > 0
        ? 1
        : 0,
    totalRows: result.total,
  };
}
