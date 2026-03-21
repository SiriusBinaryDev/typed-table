import type {
  AccessorFn,
  CellRenderer,
  ColumnTemplate,
  FilterFn,
  SortFn,
} from "../types/index.js";

type ColumnTemplateOptions = {
  header?: string;
  sortable?: boolean;
  filterable?: boolean;
  accessor?: AccessorFn<unknown, unknown> | undefined;
  cell?: CellRenderer<unknown, unknown> | undefined;
  sortFn?: SortFn<unknown, unknown> | undefined;
  filterFn?: FilterFn<unknown, unknown> | undefined;
};

function toHeaderLabel(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (value) => value.toUpperCase());
}

export function column<TKey extends string>(
  id: TKey,
  options: ColumnTemplateOptions = {},
): ColumnTemplate<TKey> {
  return {
    id,
    header: options.header ?? toHeaderLabel(id),
    sortable: options.sortable ?? false,
    filterable: options.filterable ?? false,
    ...(options.accessor ? { accessor: options.accessor } : {}),
    ...(options.cell ? { cell: options.cell } : {}),
    ...(options.sortFn ? { sortFn: options.sortFn } : {}),
    ...(options.filterFn ? { filterFn: options.filterFn } : {}),
  };
}
