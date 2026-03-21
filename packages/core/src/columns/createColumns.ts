import type {
  ColumnDef,
  ColumnInput,
  ColumnTemplate,
  RowKey,
} from "../types/index.js";

function toHeaderLabel(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (value) => value.toUpperCase());
}

function isColumnDef<TData>(
  column: ColumnInput<TData>,
): column is ColumnDef<TData> {
  return "accessor" in column && typeof column.accessor === "function";
}

function normalizeColumn<TData>(
  column: ColumnInput<TData>,
): ColumnDef<TData> {
  if (isColumnDef(column)) {
    return column;
  }

  const template = column as ColumnTemplate;
  const accessor =
    template.accessor ??
    ((row: TData) => row[template.id as RowKey<TData>]);

  return {
    id: template.id,
    header: template.header ?? toHeaderLabel(template.id),
    sortable: template.sortable ?? false,
    filterable: template.filterable ?? false,
    accessor: accessor as (row: TData) => unknown,
    ...(template.cell ? { cell: template.cell as ColumnDef<TData>["cell"] } : {}),
    ...(template.sortFn
      ? { sortFn: template.sortFn as ColumnDef<TData>["sortFn"] }
      : {}),
    ...(template.filterFn
      ? { filterFn: template.filterFn as ColumnDef<TData>["filterFn"] }
      : {}),
  };
}

export function createColumns<TData>(
  columns: readonly ColumnInput<TData>[],
): ColumnDef<TData>[] {
  return columns.map((column) => normalizeColumn(column));
}
