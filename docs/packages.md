# Package API Guide

## Choosing a Package

- Use `@typed-table/react` when building a React table UI.
- Use `@typed-table/core` when you need the pure table engine or want to compose your own integration.
- Use `@typed-table/adapters` when you want the local or remote pipeline composition without the React hook.

## `@typed-table/react`

Main exports:

- `useTable`
- `TableProvider`
- `useTableContext`
- `column`
- `createColumns`
- `createColumnFactory`
- all core types re-exported as type exports, including `FacetMinMaxValues`, `FacetValueCount`, `TableControlledState`, and `TableControlledStateInput`

Typical local usage:

```tsx
import {
  TableProvider,
  column,
  createColumns,
  useTable,
  useTableContext,
} from "@typed-table/react";

type User = {
  id: string;
  name: string;
  age: number;
  roles: string[];
};

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true, filterable: true }),
  column("age", { header: "Age", sortable: true }),
  column("roles", { header: "Roles", filterable: true }),
]);

function UsersTable() {
  const table = useTableContext<User>();

  return (
    <table>
      <thead>
        <tr>
          {table.headers.map((header) => (
            <th
              key={header.id}
              onClick={(event) =>
                table.sortBy(header.id, { multi: event.shiftKey })
              }
            >
              {header.label}
              {header.isSorted
                ? ` (${header.sortDirection} ${header.sortIndex})`
                : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row.id}>
            {row.cells.map((cell) => (
              <td key={cell.id}>{String(cell.render())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function App({ users }: { users: User[] }) {
  const table = useTable<User>({
    columns,
    data: users,
    getRowId: (row) => row.id,
    features: {
      sorting: true,
      filtering: true,
      pagination: true,
    },
  });

  return (
    <TableProvider table={table}>
      <UsersTable />
    </TableProvider>
  );
}
```

Typical remote usage:

```tsx
const table = useTable<User>({
  columns,
  mode: "remote",
  getRowId: (row) => row.id,
  query: async ({ pagination, sorting, filters }) => {
    const result = await fetchUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting,
      filters,
    });

    return {
      rows: result.items,
      total: result.total,
    };
  },
});
```

Append-oriented remote loading:

```tsx
const table = useTable<User>({
  columns,
  mode: "remote",
  getRowId: (row) => row.id,
  remoteLoading: {
    mode: "append",
  },
  query: fetchUsers,
});

if (table.canGoToNextPage && !table.loading) {
  table.nextPage();
}
```

Advanced typed column authoring:

```tsx
import { createColumnFactory, createColumns } from "@typed-table/react";

const { column } = createColumnFactory<User>();

const columns = createColumns<User>([
  column("displayName", {
    accessor: (row) => row.name.toUpperCase(),
    cell: ({ value }) => value.toLowerCase(),
    sortable: true,
  }),
]);
```

Local faceting example:

```tsx
const table = useTable<User>({
  columns,
  data: users,
  getRowId: (row) => row.id,
  features: {
    filtering: true,
  },
});

table.setFilter("name", "ad");

const roleOptions = table.getFacetedUniqueValues("roles");
const ageBounds = table.getFacetedMinMaxValues("age");
// roleOptions = [
//   { value: "admin", count: 1 },
//   { value: "editor", count: 1 },
//   { value: "viewer", count: 1 },
// ]
// ageBounds = { min: 24, max: 31 }
```

Notes:

- `useTable` owns state, actions, and remote fetching behavior.
- Use `state` plus `onStateChange(nextState)` when a host wants to control some or all table-state slices externally; omitted slices stay uncontrolled.
- `getFacetedUniqueValues(columnId)` returns local-only unique values plus counts for the current row scope after applying the other active filters.
- `getFacetedMinMaxValues(columnId)` returns local-only numeric min/max metadata for the current row scope after applying the other active filters.
- `TableProvider` and `useTableContext` are optional; they are useful when the render tree is split across components.
- Column typing is finalized at `createColumns<TData>(...)`.
- Use `createColumnFactory<TData>()` when you need strongly typed custom `accessor`, `cell`, `sortFn`, or `filterFn` callbacks.
- Accessor columns can use arbitrary string ids as long as they provide an accessor.
- `columnVisibility` is sparse state where omitted columns remain visible; use `setColumnVisibility`, `toggleColumnVisibility`, or `clearColumnVisibility` to control rendered headers and cells.
- `columnOrder` stores the current render order for columns; use `setColumnOrder`, `moveColumn`, or `clearColumnOrder` to manage it.
- `columnPinning` is sparse state where omitted columns stay in the center region; use `setColumnPinning(columnId, "left" | "right" | null)` or `clearColumnPinning()` to manage pinned regions.
- `grouping` is an ordered local-only column id list; use `setGrouping`, `toggleGrouping`, or `clearGrouping` to control grouped row levels.
- `rowExpansion` is sparse local state where omitted grouped row ids remain expanded; use `setRowExpanded`, `toggleRowExpanded`, or `clearRowExpansion()` to manage visible rows inside grouped trees.
- Group rows in `table.rows` use `row.type === "group"` and expose `depth`, `groupingColumnId`, `groupingValue`, `leafRowCount`, `canExpand`, and `isExpanded` for host-rendered nesting and expand/collapse controls.
- Call `sortBy(columnId, { multi: true })` to append or update a secondary sort descriptor instead of replacing the current sort stack.
- `TableHeader.sortIndex` exposes the 1-based priority of each sorted column.
- `TableHeader.pin` and `TableCell.pin` expose `"left"`, `"right"`, or `null` so host UIs can render pinned regions without a component library.
- `clearSortingColumn(columnId)` removes one descriptor from the current sort stack without resetting the others.
- `remoteLoading: { mode: "append" }` keeps prior remote pages in `table.rows` when users load the next page in the same query scope. Changing sorting, filters, or page size resets the accumulated rows.
- If you want hiding a column to also clear hidden-column filter or sorting state, do that in your UI event handler.

Column layout example:

```tsx
const table = useTable<User>({
  columns,
  data: users,
});

table.moveColumn("displayName", 0);
table.setColumnPinning("name", "left");
table.setColumnPinning("actions", "right");

table.headers.map((header) => ({
  id: header.id,
  pin: header.pin,
}));
```

Manual visibility reconciliation example:

```tsx
function handleColumnVisibilityChange(columnId: string, visible: boolean) {
  table.setColumnVisibility(columnId, visible);

  if (!visible) {
    table.clearFilter(columnId);
    table.clearSortingColumn(columnId);
  }
}
```

Optional remote row selection example:

```tsx
const table = useTable<User>({
  columns,
  mode: "remote",
  query: fetchUsers,
  getRowId: (row) => row.id,
  features: {
    pagination: true,
    rowSelection: true,
  },
  remoteRowSelection: {
    strategy: "all-except",
  },
});

table.remoteRowSelection?.selectAllMatchingRows();
table.toggleRowSelection("row-42");

// Reset selection if the remote query scope changes in your app.
table.clearRowSelection();
```

Example apps:

- `examples/basic-table` covers local sorting, filtering, grouping, expandable grouped rows, pagination, row selection, column visibility, shift-click multi-sort, and local faceted filter metadata.
- `examples/filter-row-selection` focuses on multi-control filtering, selection summaries, and context-driven table composition.
- `examples/remote-pagination` shows remote querying with pagination, sorting, ordered sort descriptors, and optional dataset-level remote row selection.
- `examples/infinite-scroll` shows append-oriented remote loading with sequential page accumulation and a scroll-triggered load-more sentinel.

## `@typed-table/core`

Main exports:

- `column`
- `createColumns`
- `createColumnFactory`
- `createTableState`
- `applyFilters`
- `getFacetedUniqueValues`
- `getFacetedMinMaxValues`
- `applySorting`
- `applyPagination`
- `createRows`
- `createGroupedRows`
- `getOrderedColumns`
- `createHeaders`
- pure state actions such as `setPage`, `setFilter`, `toggleSorting`, `clearSortingColumn`, `setGrouping`, `toggleRowExpanded`, `setColumnVisibility`, `setColumnOrder`, `moveColumn`, and `setColumnPinning`
- table types such as `FacetMinMaxValues`, `FacetValueCount`, `TableState`, `TableControlledState<TData>`, `TableControlledStateInput<TData>`, `TableRow<TData>`, `TableHeader`, `TableInstance<TData>`, `RemoteLoadingConfig`, and the remote-row-selection helper types used by the React package

Typical pure-engine usage:

```ts
import {
  applyFilters,
  applyPagination,
  applySorting,
  column,
  createColumns,
  createHeaders,
  createRows,
  createTableState,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
  roles: string[];
};

const columns = createColumns<User>([
  column("name", { sortable: true, filterable: true }),
  column("age", { sortable: true }),
  column("roles", { filterable: true }),
]);

const state = createTableState({
  sorting: [
    { columnId: "name", direction: "asc" },
    { columnId: "age", direction: "desc" },
  ],
  pagination: {
    page: 0,
    pageSize: 10,
  },
  filters: {
    name: "al",
  },
});

const filtered = applyFilters(users, state.filters, columns);
const sorted = applySorting(filtered, state.sorting, columns);
const paged = applyPagination(sorted, state.pagination);
const roleOptions = getFacetedUniqueValues(users, "roles", columns, state.filters);
const ageBounds = getFacetedMinMaxValues(users, "age", columns, state.filters);

const headers = createHeaders(columns, state.sorting);
const rows = createRows(paged, {
  columns,
  getRowId: (row) => row.id,
  rowSelection: state.rowSelection,
});
```

Notes:

- `core` is framework-agnostic.
- Pipeline functions are small and composable by design.
- `getFacetedUniqueValues(data, columnId, columns, filters)` derives local unique values plus counts after applying the other active filters; remote or server-backed faceting stays out of scope for now.
- `getFacetedMinMaxValues(data, columnId, columns, filters)` derives local numeric min/max metadata after applying the other active filters and returns `null` when the faceted values are not numeric.
- Sorting descriptors are applied in order until a comparator produces a non-zero result.
- `createTableState(...)` and `setSorting(...)` still normalize the legacy single-descriptor sorting input.
- Column visibility only affects rendered headers and cells; sorting and filtering can still reference hidden columns if you leave that state intact.
- `getOrderedColumns(...)` combines explicit column order with left/right pinning so adapters and host code can derive a stable render layout from headless state.
- `createGroupedRows(...)` builds a grouped local row tree and returns the flattened visible rows used for pagination.
- Group rows use `TableRow.type === "group"`; their metadata is designed for host-rendered nesting and expand/collapse controls.
- `clearSortingColumn(state, columnId)` is useful when UI code wants to reconcile hidden-column state manually.
- The advanced remote include/exclude selection controller is exposed through `useTable`; `core` keeps the basic row-selection map and related table types.
- `RemoteLoadingConfig` describes whether remote pages replace the current rows or append sequentially in React remote mode.
- Use `core` directly when you do not want React state ownership.
- `createColumnFactory<TData>()` is useful when advanced column callbacks need row-aware type inference.

## `@typed-table/adapters`

Main exports:

- `createLocalAdapter`
- `createRemoteAdapter`

`createLocalAdapter` composes the core pipeline for in-memory rows:

```ts
import { createLocalAdapter } from "@typed-table/adapters";
import { column, createColumns, createTableState } from "@typed-table/core";

const columns = createColumns<User>([
  column("name", { sortable: true }),
  column("age", { sortable: true }),
]);

const model = createLocalAdapter({
  columns,
  data: users,
  state: createTableState(),
  getRowId: (row) => row.id,
});
```

`createRemoteAdapter` delegates row loading to your query function:

```ts
import { createRemoteAdapter } from "@typed-table/adapters";
import { createTableState } from "@typed-table/core";

const model = await createRemoteAdapter({
  columns,
  state: createTableState({
    sorting: [
      { columnId: "name", direction: "asc" },
      { columnId: "age", direction: "desc" },
    ],
  }),
  query: async ({ pagination, sorting, filters }) => {
    const result = await fetchUsers({ pagination, sorting, filters });

    return {
      rows: result.items,
      total: result.total,
    };
  },
  getRowId: (row) => row.id,
});
```

Notes:

- Adapters are useful when you want the composed table model without using the React hook.
- The React package uses these adapters internally.
- `createLocalAdapter` groups local rows before paginating the flattened visible result when grouping is enabled.
- Remote queries receive the ordered sorting descriptor list so server-backed sorting can mirror the local pipeline.
- Both adapters honor `state.columnVisibility` when `features.columnVisibility` is enabled.
- Grouping, row expansion, and faceted metadata are currently local-only; the remote adapter leaves server-backed grouping and faceting semantics out of scope in this version.

