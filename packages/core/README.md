# @typed-table/core

Framework-agnostic table engine for `typed-table`.

## Installation

```bash
npm install @typed-table/core
```

## What It Provides

- typed column definitions through `column`, `createColumns`, and `createColumnFactory`
- serializable table state through `createTableState`
- pure filtering, sorting, pagination, and row-order helpers
- faceting helpers through `getFacetedUniqueValues(...)` and `getFacetedMinMaxValues(...)`
- flat, grouped, and remote-grouped row-model builders
- pure state actions for sorting, filters, grouping, expansion, visibility, column ordering, row ordering, pinning, and sizing

## Example

```ts
import {
  applyFilters,
  applyPagination,
  applyRowOrder,
  applySorting,
  column,
  createColumns,
  createRows,
  createTableState,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
};

const users: User[] = [
  { id: "1", name: "Alice", age: 31 },
  { id: "2", name: "Bob", age: 29 },
];

const columns = createColumns<User>([
  column("name", { sortable: true, filterable: true }),
  column("age", { sortable: true }),
]);

const state = createTableState({
  filters: { name: "al" },
  rowOrder: ["2", "1"],
  sorting: [{ columnId: "age", direction: "desc" }],
  pagination: { page: 0, pageSize: 10 },
});

const ordered = applyRowOrder(users, state.rowOrder, (row) => row.id);
const filtered = applyFilters(ordered, state.filters, columns);
const sorted = applySorting(filtered, state.sorting, columns);
const paged = applyPagination(sorted, state.pagination);

const rows = createRows(paged, {
  columns,
  getRowId: (row) => row.id,
  rowSelection: state.rowSelection,
});
```

## Notes

- `@typed-table/core` is side-effect free and does not depend on React.
- `createRemoteGroupedRows(...)` can normalize server-provided grouped row descriptors into the same headless `TableRow` shape used by local grouping.
- `rowOrder` is an explicit base local row order keyed by stable row ids; sorting can still change the visible order after that base order is applied.
- Headers and cells expose resolved `size`, `minSize`, `maxSize`, and `canResize` metadata from column definitions plus sparse `columnSizing` overrides.
- Hidden columns do not automatically clear active sorting or filtering state.

## More

- Repository: <https://github.com/SiriusBinaryDev/typed-table>
- Package guide: <https://github.com/SiriusBinaryDev/typed-table/blob/main/docs/packages.md>

