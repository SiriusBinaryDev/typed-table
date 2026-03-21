import type {
  AccessorFn,
  CellRenderer,
  ColumnDef,
  ColumnId,
  FilterFn,
  RowKey,
  SortFn,
} from "../types/index.js";

type BaseColumnOptions<TData, TValue> = {
  header?: string;
  sortable?: boolean;
  filterable?: boolean;
  cell?: CellRenderer<TData, TValue> | undefined;
  sortFn?: SortFn<TData, TValue> | undefined;
  filterFn?: FilterFn<TData, TValue> | undefined;
};

type KeyColumnOptions<TData, TKey extends RowKey<TData>> =
  BaseColumnOptions<TData, TData[TKey]> & {
    accessor?: AccessorFn<TData, TData[TKey]> | undefined;
  };

type AccessorColumnOptions<TData, TValue> = BaseColumnOptions<TData, TValue> & {
  accessor: AccessorFn<TData, TValue>;
};

type ColumnBuildOptions<TData> = BaseColumnOptions<TData, unknown> & {
  accessor?: AccessorFn<TData, unknown> | undefined;
};

function toHeaderLabel(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (value) => value.toUpperCase());
}

function buildColumn<TData, TId extends ColumnId<TData>>(
  id: TId,
  options: ColumnBuildOptions<TData>,
): ColumnDef<TData> {
  const accessor =
    options.accessor ??
    ((row: TData) => row[id as unknown as RowKey<TData>]);

  return {
    id,
    header: options.header ?? toHeaderLabel(id),
    sortable: options.sortable ?? false,
    filterable: options.filterable ?? false,
    accessor: accessor as ColumnDef<TData>["accessor"],
    ...(options.cell ? { cell: options.cell as ColumnDef<TData>["cell"] } : {}),
    ...(options.sortFn ? { sortFn: options.sortFn as ColumnDef<TData>["sortFn"] } : {}),
    ...(options.filterFn ? { filterFn: options.filterFn as ColumnDef<TData>["filterFn"] } : {}),
  };
}

export function createColumnFactory<TData>() {
  function column<TKey extends RowKey<TData>>(
    id: TKey,
    options?: KeyColumnOptions<TData, TKey>,
  ): ColumnDef<TData>;
  function column<TId extends ColumnId<TData>, TValue>(
    id: TId,
    options: AccessorColumnOptions<TData, TValue>,
  ): ColumnDef<TData>;
  function column<TId extends ColumnId<TData>, TValue>(
    id: TId,
    options?:
      | KeyColumnOptions<TData, RowKey<TData>>
      | AccessorColumnOptions<TData, TValue>,
  ): ColumnDef<TData> {
    return buildColumn(id, (options ?? {}) as ColumnBuildOptions<TData>);
  }

  return {
    column,
  };
}

