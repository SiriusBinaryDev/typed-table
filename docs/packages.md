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
- `exportTableToCsv`
- `getRowDropTargetIndex`
- `reorderRowIds`
- `partitionHeadersByPin`
- `partitionRowCellsByPin`
- `getVirtualTableLayout`
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
  features: {
    grouping: true,
    rowExpansion: true,
  },
  query: async ({ pagination, sorting, filters, grouping, rowExpansion }) => {
    const result = await fetchUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting,
      filters,
      grouping,
      rowExpansion,
    });

    return {
      rows: result.items,
      total: result.total,
      groupedRows: result.groupedRows,
      faceting: result.faceting,
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
- `getFacetedUniqueValues(columnId)` returns local faceting metadata in local mode, or remote faceting metadata when the remote query result provides it.
- `getFacetedMinMaxValues(columnId)` returns local numeric min/max metadata in local mode, or remote faceting metadata when the remote query result provides it.
- `TableProvider` and `useTableContext` are optional; they are useful when the render tree is split across components.
- Column typing is finalized at `createColumns<TData>(...)`.
- Use `createColumnFactory<TData>()` when you need strongly typed custom `accessor`, `cell`, `sortFn`, or `filterFn` callbacks.
- Accessor columns can use arbitrary string ids as long as they provide an accessor.
- `columnVisibility` is sparse state where omitted columns remain visible; use `setColumnVisibility`, `toggleColumnVisibility`, or `clearColumnVisibility` to control rendered headers and cells.
- `columnOrder` stores the current render order for columns; use `setColumnOrder`, `moveColumn`, or `clearColumnOrder` to manage it.
- `rowOrder` stores the base local row order keyed by `getRowId(...)`; use `setRowOrder`, `moveRow`, or `clearRowOrder` to manage it. Sorting or grouping can still change the visible order after that base order is applied.
- `getRowDropTargetIndex(...)` and `reorderRowIds(...)` are minimal drag-and-drop helpers for host-owned reorder surfaces. They stay library-agnostic and do not ship sensors, overlays, or DOM state.
- `columnPinning` is sparse state where omitted columns stay in the center region; use `setColumnPinning(columnId, "left" | "right" | null)` or `clearColumnPinning()` to manage pinned regions.
- `columnSizing` is sparse override state where omitted columns fall back to their definition sizes; use `setColumnSize(columnId, size)`, `resizeColumn(columnId, delta)`, or `clearColumnSizing()` to manage host-rendered widths.
- `TableHeader.size`, `TableHeader.minSize`, `TableHeader.maxSize`, and the matching `TableCell` fields expose the resolved sizing metadata for the current visible layout.
- `partitionHeadersByPin(...)`, `partitionRowCellsByPin(...)`, and `getVirtualTableLayout(...)` provide minimal virtualization-friendly pin partitions and width totals without shipping a virtualizer.
- `grouping` is an ordered column id list; in local mode it drives client grouping, and in remote mode it is forwarded to the query so the server can return grouped rows.
- `rowExpansion` is sparse state where omitted grouped row ids remain expanded; in local mode it controls client-side grouped rows, and in remote mode it is forwarded to the query so the server can return the next grouped view.
- Group rows in `table.rows` use `row.type === "group"` and expose `depth`, `groupingColumnId`, `groupingValue`, `leafRowCount`, `canExpand`, and `isExpanded` for host-rendered nesting and expand/collapse controls.
- Call `sortBy(columnId, { multi: true })` to append or update a secondary sort descriptor instead of replacing the current sort stack.
- `TableHeader.sortIndex` exposes the 1-based priority of each sorted column.
- `TableHeader.pin` and `TableCell.pin` expose `"left"`, `"right"`, or `null` so host UIs can render pinned regions without a component library.
- `clearSortingColumn(columnId)` removes one descriptor from the current sort stack without resetting the others.
- `remoteLoading: { mode: "append" }` keeps prior remote pages in `table.rows` when users load the next page in the same query scope. Changing sorting, filters, grouping, expansion, or page size resets the accumulated rows.
- Advanced remote row selection can opt into automatic resets on query-scope changes with `resetOnQueryChange: true`; the default scope is sorting + filters + grouping + page size, and `getQueryScopeKey(...)` lets hosts narrow or widen that boundary explicitly.
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
table.resizeColumn("displayName", 32);

table.headers.map((header) => ({
  id: header.id,
  pin: header.pin,
  size: header.size,
}));
```

Local row ordering example:

```tsx
const table = useTable<User>({
  columns,
  data: users,
  getRowId: (row) => row.id,
  features: {
    rowOrdering: true,
  },
});

table.moveRow("2", 0);
table.setRowOrder(["2", "1"]);
table.clearRowOrder();
```

Drag-and-drop row ordering example:

```tsx
import { reorderRowIds } from "@typed-table/react";

const orderedRowIds = users.map((user) => user.id);

function handleDragEnd(activeId: string, overId: string | null) {
  table.setRowOrder(reorderRowIds(orderedRowIds, activeId, overId));
}
```

Minimal virtualization layout example:

```tsx
const layout = getVirtualTableLayout(table);
const pinnedCells = partitionRowCellsByPin(table.rows[0]!);

layout.leftWidth;
layout.centerWidth;
layout.rightWidth;
layout.totalWidth;
pinnedCells.left;
pinnedCells.center;
pinnedCells.right;
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

// Opt in to automatic resets when sorting, filters, or page size change.
const autoResetTable = useTable<User>({
  columns,
  mode: "remote",
  query: fetchUsers,
  getRowId: (row) => row.id,
  remoteRowSelection: {
    strategy: "all-except",
    resetOnQueryChange: true,
  },
});

// Or provide your own query-scope key when the default boundary is too broad.
const customScopeTable = useTable<User>({
  columns,
  mode: "remote",
  query: fetchUsers,
  getRowId: (row) => row.id,
  remoteRowSelection: {
    strategy: "all-except",
    resetOnQueryChange: true,
    getQueryScopeKey: ({ filters }) => JSON.stringify({ tenant: filters.tenantId ?? null }),
  },
});

// You can still clear it manually whenever your app needs to.
table.clearRowSelection();
```

Example apps:

- `examples/basic-table` covers local sorting, filtering, drag-and-drop row ordering, grouping, expandable grouped rows, pagination, row selection, column visibility, headless column sizing controls, shift-click multi-sort, and local faceted filter metadata.
- `examples/filter-row-selection` focuses on multi-control filtering, selection summaries, and context-driven table composition.
- `examples/remote-pagination` shows remote querying with pagination, sorting, server-backed grouping/faceting, ordered sort descriptors, and optional dataset-level remote row selection.
- `examples/infinite-scroll` shows append-oriented remote loading with sequential page accumulation and a scroll-triggered load-more sentinel. It is a loading-pattern example, not a DOM-windowing example.
- For broader row/column virtualization guidance and the limits of the minimal React helper surface, see `docs/virtualization.md`.

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
- pure state actions such as `setPage`, `setFilter`, `toggleSorting`, `clearSortingColumn`, `setGrouping`, `toggleRowExpanded`, `setColumnVisibility`, `setColumnOrder`, `moveColumn`, `setRowOrder`, `moveRow`, and `setColumnPinning`
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
- `getFacetedUniqueValues(data, columnId, columns, filters)` derives local unique values plus counts after applying the other active filters; remote faceting uses server-provided metadata instead of this helper.
- `getFacetedMinMaxValues(data, columnId, columns, filters)` derives local numeric min/max metadata after applying the other active filters and returns `null` when the faceted values are not numeric.
- Sorting descriptors are applied in order until a comparator produces a non-zero result.
- `createTableState(...)` and `setSorting(...)` still normalize the legacy single-descriptor sorting input.
- Column visibility only affects rendered headers and cells; sorting and filtering can still reference hidden columns if you leave that state intact.
- `applyRowOrder(data, rowOrder, getRowId)` applies explicit local row order before later filtering, sorting, grouping, or pagination.
- `getOrderedColumns(...)` combines explicit column order with left/right pinning so adapters and host code can derive a stable render layout from headless state.
- `createGroupedRows(...)` builds a grouped local row tree and returns the flattened visible rows used for pagination.
- `createHeaders(...)`, `createRows(...)`, and `createGroupedRows(...)` resolve `size`, `minSize`, `maxSize`, and `canResize` metadata from the column definitions plus sparse `columnSizing` state.
- Group rows use `TableRow.type === "group"`; their metadata is designed for host-rendered nesting and expand/collapse controls.
- `clearSortingColumn(state, columnId)` is useful when UI code wants to reconcile hidden-column state manually.
- `setColumnSize(state, columnId, size, columns)` and `resizeColumn(state, columnId, delta, columns)` clamp to each column's min/max bounds and keep `columnSizing` sparse by dropping overrides that return to the definition size.
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
- `createLocalAdapter` applies local row order before later filtering, sorting, grouping, and pagination when `state.rowOrder` plus `getRowId(...)` are available.
- `createLocalAdapter` groups local rows before paginating the flattened visible result when grouping is enabled.
- Remote queries receive the ordered sorting descriptor list so server-backed sorting can mirror the local pipeline.
- Both adapters honor `state.columnVisibility` when `features.columnVisibility` is enabled.
- The remote adapter forwards `grouping` and `rowExpansion` to the query, and it can normalize optional `groupedRows` plus `faceting` metadata from the query result.






