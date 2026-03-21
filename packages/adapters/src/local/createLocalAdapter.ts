import {
  applyFilters,
  applyPagination,
  applyRowOrder,
  applySorting,
  createGroupedRows,
  createHeaders,
  createRows,
  getOrderedColumns,
  getPageCount,
  getVisibleColumns,
  type LocalAdapterInput,
  type TableModel,
  type TableRow,
} from "@typed-table/core";

export function createLocalAdapter<TData>(
  input: LocalAdapterInput<TData>,
): TableModel<TData> {
  const filteringEnabled = input.features?.filtering ?? true;
  const sortingEnabled = input.features?.sorting ?? true;
  const paginationEnabled = input.features?.pagination ?? true;
  const rowSelectionEnabled = input.features?.rowSelection ?? true;
  const columnVisibilityEnabled = input.features?.columnVisibility ?? true;
  const columnOrderingEnabled = input.features?.columnOrdering ?? true;
  const rowOrderingEnabled = input.features?.rowOrdering ?? true;
  const columnPinningEnabled = input.features?.columnPinning ?? true;
  const columnResizingEnabled = input.features?.columnResizing ?? true;
  const groupingEnabled = input.features?.grouping ?? true;
  const rowExpansionEnabled = input.features?.rowExpansion ?? true;
  const visibleColumns = columnVisibilityEnabled
    ? getVisibleColumns(input.columns, input.state.columnVisibility)
    : [...input.columns];
  const orderedVisibleColumns = getOrderedColumns(
    visibleColumns,
    columnOrderingEnabled ? input.state.columnOrder : null,
    columnPinningEnabled ? input.state.columnPinning : null,
  );

  const baseRows = rowOrderingEnabled
    ? applyRowOrder(input.data, input.state.rowOrder, input.getRowId)
    : [...input.data];

  const filteredRows = filteringEnabled
    ? applyFilters(baseRows, input.state.filters, input.columns)
    : baseRows;

  const sortedRows = sortingEnabled
    ? applySorting(filteredRows, input.state.sorting, input.columns)
    : filteredRows;

  const groupableColumnIds = new Set(input.columns.map((column) => column.id));
  const grouping = groupingEnabled
    ? input.state.grouping.filter((columnId) => groupableColumnIds.has(columnId))
    : [];
  const groupedRows = grouping.length > 0
    ? createGroupedRows(sortedRows, {
        allColumns: input.columns,
        visibleColumns: orderedVisibleColumns,
        grouping,
        columnPinning: columnPinningEnabled ? input.state.columnPinning : undefined,
        columnSizing: columnResizingEnabled ? input.state.columnSizing : undefined,
        rowSelection: rowSelectionEnabled ? input.state.rowSelection : {},
        rowExpansion: rowExpansionEnabled ? input.state.rowExpansion : {},
        ...(input.getRowId ? { getRowId: input.getRowId } : {}),
      })
    : null;

  const totalRows = groupedRows ? groupedRows.totalRows : sortedRows.length;
  const pageCount = paginationEnabled
    ? getPageCount(totalRows, input.state.pagination.pageSize)
    : totalRows > 0
      ? 1
      : 0;
  const rows: TableRow<TData>[] = groupedRows
    ? paginationEnabled
      ? applyPagination(groupedRows.rows, input.state.pagination)
      : [...groupedRows.rows]
    : createRows(
        paginationEnabled
          ? applyPagination(sortedRows, input.state.pagination)
          : [...sortedRows],
        {
          columns: orderedVisibleColumns,
          columnPinning: columnPinningEnabled ? input.state.columnPinning : undefined,
          columnSizing: columnResizingEnabled ? input.state.columnSizing : undefined,
          rowSelection: rowSelectionEnabled ? input.state.rowSelection : {},
          ...(input.getRowId ? { getRowId: input.getRowId } : {}),
        },
      );

  return {
    headers: createHeaders(
      orderedVisibleColumns,
      sortingEnabled ? input.state.sorting : null,
      columnPinningEnabled ? input.state.columnPinning : null,
      columnResizingEnabled ? input.state.columnSizing : null,
    ),
    rows,
    pageCount,
    totalRows,
  };
}
