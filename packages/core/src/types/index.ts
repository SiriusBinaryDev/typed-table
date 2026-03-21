export type RowKey<TData> = Extract<keyof TData, string>;

export type ColumnId<TData = unknown> = string;

export type SortDirection = "asc" | "desc";

export type SortDescriptor<TData = unknown> = {
  columnId: ColumnId<TData>;
  direction: SortDirection;
};

export type SortingState<TData = unknown> = SortDescriptor<TData>[] | null;

export type SortingStateInput<TData = unknown> =
  | SortDescriptor<TData>
  | SortDescriptor<TData>[]
  | null;

export type SortByOptions = {
  multi?: boolean;
};

export type FiltersState = Record<string, unknown>;

export type RowSelectionState = Record<string, boolean>;

export type RemoteRowSelectionMode = "include" | "all-except";

export type RemoteRowSelectionState = {
  mode: RemoteRowSelectionMode;
  includedIds: string[];
  excludedIds: string[];
};

export type RemoteRowSelectionConfig<TData = unknown> = {
  strategy: "all-except";
  resetOnQueryChange?: boolean | undefined;
  getQueryScopeKey?: ((context: TableQueryContext<TData>) => string) | undefined;
};

export type RemoteRowSelectionController = {
  strategy: "all-except";
  state: RemoteRowSelectionState;
  allMatchingRowsSelected: boolean;
  selectedRowCount: number;
  selectAllMatchingRows: () => void;
};

export type RemoteLoadingMode = "replace" | "append";

export type RemoteLoadingConfig = {
  mode: RemoteLoadingMode;
};

export type ColumnVisibilityState = Record<string, boolean>;

export type ColumnOrderState = string[];

export type RowOrderState = string[];

export type ColumnPinningPosition = "left" | "right";

export type ColumnPinningState = Record<string, ColumnPinningPosition>;

export type ColumnSizingState = Record<string, number>;

export type GroupingState<TData = unknown> = ColumnId<TData>[];

export type RowExpansionState = Record<string, boolean>;

export type FacetValueCount<TValue = unknown> = {
  value: TValue;
  count: number;
};

export type FacetMinMaxValues = {
  min: number;
  max: number;
} | null;

export type PaginationState = {
  page: number;
  pageSize: number;
};

export type TableState = {
  pagination: PaginationState;
  sorting: SortingState;
  filters: FiltersState;
  rowSelection: RowSelectionState;
  columnVisibility: ColumnVisibilityState;
  columnOrder: ColumnOrderState;
  rowOrder: RowOrderState;
  columnPinning: ColumnPinningState;
  columnSizing: ColumnSizingState;
  grouping: GroupingState;
  rowExpansion: RowExpansionState;
  loading: boolean;
  error: Error | null;
};

export type PartialTableState = {
  pagination?: Partial<PaginationState>;
  sorting?: SortingStateInput;
  filters?: FiltersState;
  rowSelection?: RowSelectionState;
  columnVisibility?: ColumnVisibilityState;
  columnOrder?: ColumnOrderState;
  rowOrder?: RowOrderState;
  columnPinning?: ColumnPinningState;
  columnSizing?: ColumnSizingState;
  grouping?: GroupingState | undefined;
  rowExpansion?: RowExpansionState | undefined;
  loading?: boolean;
  error?: Error | null;
};

export type TableControlledState<TData = unknown> = {
  pagination: PaginationState;
  sorting: SortingState<TData>;
  filters: FiltersState;
  rowSelection: RowSelectionState;
  columnVisibility: ColumnVisibilityState;
  columnOrder: ColumnOrderState;
  rowOrder: RowOrderState;
  columnPinning: ColumnPinningState;
  columnSizing: ColumnSizingState;
  grouping: GroupingState<TData>;
  rowExpansion: RowExpansionState;
};

export type TableControlledStateInput<TData = unknown> = {
  pagination?: PaginationState | undefined;
  sorting?: SortingStateInput<TData> | undefined;
  filters?: FiltersState | undefined;
  rowSelection?: RowSelectionState | undefined;
  columnVisibility?: ColumnVisibilityState | undefined;
  columnOrder?: ColumnOrderState | undefined;
  rowOrder?: RowOrderState | undefined;
  columnPinning?: ColumnPinningState | undefined;
  columnSizing?: ColumnSizingState | undefined;
  grouping?: GroupingState<TData> | undefined;
  rowExpansion?: RowExpansionState | undefined;
};

export type TableFeatures = {
  sorting?: boolean;
  filtering?: boolean;
  pagination?: boolean;
  rowSelection?: boolean;
  columnVisibility?: boolean;
  columnOrdering?: boolean;
  rowOrdering?: boolean;
  columnPinning?: boolean;
  columnResizing?: boolean;
  grouping?: boolean;
  rowExpansion?: boolean;
};

export type AccessorFn<TData, TValue> = (row: TData) => TValue;

export type CellRenderer<TData, TValue> = (context: {
  value: TValue;
  row: TData;
  column: ColumnDef<TData, TValue>;
}) => unknown;

export type SortFn<TData, TValue> = (
  left: TValue,
  right: TValue,
  leftRow: TData,
  rightRow: TData,
) => number;

export type FilterFn<TData, TValue> = (
  value: TValue,
  filterValue: unknown,
  row: TData,
) => boolean;

export type ColumnOptions<TData, TKey extends RowKey<TData>> = {
  header?: string;
  sortable?: boolean;
  filterable?: boolean;
  size?: number | undefined;
  minSize?: number | undefined;
  maxSize?: number | undefined;
  resizable?: boolean | undefined;
  accessor?: AccessorFn<TData, TData[TKey]> | undefined;
  cell?: CellRenderer<TData, TData[TKey]> | undefined;
  sortFn?: SortFn<TData, TData[TKey]> | undefined;
  filterFn?: FilterFn<TData, TData[TKey]> | undefined;
};

export type ColumnTemplate<TKey extends string = string> = {
  id: TKey;
  header?: string;
  sortable?: boolean;
  filterable?: boolean;
  size?: number | undefined;
  minSize?: number | undefined;
  maxSize?: number | undefined;
  resizable?: boolean | undefined;
  accessor?: AccessorFn<unknown, unknown> | undefined;
  cell?: CellRenderer<unknown, unknown> | undefined;
  sortFn?: SortFn<unknown, unknown> | undefined;
  filterFn?: FilterFn<unknown, unknown> | undefined;
};

export type ColumnDef<TData, TValue = unknown> = {
  id: ColumnId<TData>;
  header: string;
  sortable: boolean;
  filterable: boolean;
  size?: number | undefined;
  minSize?: number | undefined;
  maxSize?: number | undefined;
  resizable: boolean;
  accessor: AccessorFn<TData, TValue>;
  cell?: CellRenderer<TData, TValue> | undefined;
  sortFn?: SortFn<TData, TValue> | undefined;
  filterFn?: FilterFn<TData, TValue> | undefined;
};

export type ColumnInput<TData> = ColumnTemplate | ColumnDef<TData>;

export type TableCell<TData> = {
  id: string;
  columnId: string;
  pin: ColumnPinningPosition | null;
  size: number;
  minSize: number;
  maxSize: number | null;
  canResize: boolean;
  value: unknown;
  render: () => unknown;
};

export type TableRow<TData> = {
  id: string;
  type: "data" | "group";
  original: TData | null;
  parentId: string | null;
  depth: number;
  isSelected: boolean;
  canExpand: boolean;
  isExpanded: boolean;
  groupingColumnId: string | null;
  groupingValue: unknown;
  leafRowCount: number;
  subRows: TableRow<TData>[];
  cells: TableCell<TData>[];
};

export type TableHeader = {
  id: string;
  label: string;
  pin: ColumnPinningPosition | null;
  size: number;
  minSize: number;
  maxSize: number | null;
  canResize: boolean;
  sortable: boolean;
  isSorted: boolean;
  sortDirection: SortDirection | null;
  sortIndex: number | null;
};

export type GetRowId<TData> = (row: TData, index: number) => string;

export type LocalAdapterInput<TData> = {
  columns: readonly ColumnDef<TData>[];
  data: readonly TData[];
  state: TableState;
  features?: TableFeatures | undefined;
  getRowId?: GetRowId<TData> | undefined;
};

export type TableQueryContext<TData = unknown> = {
  pagination: PaginationState;
  sorting: SortingState<TData>;
  filters: FiltersState;
  signal?: AbortSignal | undefined;
};

export type TableQueryResult<TData> = {
  rows: readonly TData[];
  total: number;
};

export type TableQuery<TData> = (
  context: TableQueryContext<TData>,
) => Promise<TableQueryResult<TData>>;

export type RemoteAdapterInput<TData> = {
  columns: readonly ColumnDef<TData>[];
  state: TableState;
  features?: TableFeatures | undefined;
  query: TableQuery<TData>;
  getRowId?: GetRowId<TData> | undefined;
  signal?: AbortSignal | undefined;
};

export type TableModel<TData> = {
  headers: TableHeader[];
  rows: TableRow<TData>[];
  pageCount: number;
  totalRows: number;
};

export type CsvExportOptions<TData> = {
  includeHeaders?: boolean;
  includeGroupRows?: boolean;
  delimiter?: string;
  newline?: string;
  getHeaderValue?: ((header: TableHeader) => unknown) | undefined;
  getCellValue?:
    | ((cell: TableCell<TData>, row: TableRow<TData>) => unknown)
    | undefined;
};

export type UseTableBaseConfig<TData> = {
  columns: readonly ColumnDef<TData>[];
  features?: TableFeatures | undefined;
  getRowId?: GetRowId<TData> | undefined;
  initialState?: PartialTableState | undefined;
  state?: TableControlledStateInput<TData> | undefined;
  onStateChange?: ((state: TableControlledState<TData>) => void) | undefined;
};

export type LocalTableConfig<TData> = UseTableBaseConfig<TData> & {
  mode?: "local";
  data: readonly TData[];
};

export type RemoteTableConfig<TData> = UseTableBaseConfig<TData> & {
  mode: "remote";
  query: TableQuery<TData>;
  remoteRowSelection?: RemoteRowSelectionConfig<TData> | undefined;
  remoteLoading?: RemoteLoadingConfig | undefined;
};

export type UseTableConfig<TData> =
  | LocalTableConfig<TData>
  | RemoteTableConfig<TData>;

export type TableInstance<TData> = {
  headers: TableHeader[];
  rows: TableRow<TData>[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  sorting: SortingState<TData>;
  filters: FiltersState;
  selectedRowIds: string[];
  remoteRowSelection: RemoteRowSelectionController | null;
  columnVisibility: ColumnVisibilityState;
  columnOrder: ColumnOrderState;
  rowOrder: RowOrderState;
  columnPinning: ColumnPinningState;
  columnSizing: ColumnSizingState;
  grouping: GroupingState<TData>;
  rowExpansion: RowExpansionState;
  loading: boolean;
  error: Error | null;
  canGoToNextPage: boolean;
  canGoToPreviousPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  sortBy: (columnId: ColumnId<TData>, options?: SortByOptions) => void;
  setSorting: (sorting: SortingStateInput<TData>) => void;
  clearSorting: () => void;
  clearSortingColumn: (columnId: ColumnId<TData>) => void;
  setFilter: (columnId: ColumnId<TData>, value: unknown) => void;
  clearFilter: (columnId: ColumnId<TData>) => void;
  clearFilters: () => void;
  getFacetedUniqueValues: (columnId: ColumnId<TData>) => FacetValueCount[];
  getFacetedMinMaxValues: (columnId: ColumnId<TData>) => FacetMinMaxValues;
  setColumnVisibility: (columnId: ColumnId<TData>, visible: boolean) => void;
  toggleColumnVisibility: (columnId: ColumnId<TData>) => void;
  clearColumnVisibility: () => void;
  setGrouping: (grouping: ColumnId<TData>[]) => void;
  toggleGrouping: (columnId: ColumnId<TData>) => void;
  clearGrouping: () => void;
  setColumnOrder: (columnOrder: ColumnId<TData>[]) => void;
  moveColumn: (columnId: ColumnId<TData>, targetIndex: number) => void;
  clearColumnOrder: () => void;
  setRowOrder: (rowOrder: string[]) => void;
  moveRow: (rowId: string, targetIndex: number) => void;
  clearRowOrder: () => void;
  setColumnPinning: (
    columnId: ColumnId<TData>,
    position: ColumnPinningPosition | null,
  ) => void;
  clearColumnPinning: () => void;
  setColumnSize: (columnId: ColumnId<TData>, size: number) => void;
  resizeColumn: (columnId: ColumnId<TData>, delta: number) => void;
  clearColumnSizing: () => void;
  setRowExpanded: (rowId: string, expanded: boolean) => void;
  toggleRowExpanded: (rowId: string) => void;
  clearRowExpansion: () => void;
  toggleRowSelection: (rowId: string) => void;
  clearRowSelection: () => void;
};








