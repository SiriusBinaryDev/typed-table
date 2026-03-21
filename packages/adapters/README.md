# @typed-table/adapters

Composed local and remote data adapters for `typed-table`.

## Installation

```bash
npm install @typed-table/adapters @typed-table/core
```

## What It Provides

- `createLocalAdapter(...)` for in-memory table models
- `createRemoteAdapter(...)` for query-driven table models
- composition over `@typed-table/core` without React state ownership

## Example

```ts
import { createLocalAdapter } from "@typed-table/adapters";
import { column, createColumns, createTableState } from "@typed-table/core";

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
  column("name", { sortable: true }),
  column("age", { sortable: true }),
]);

const model = createLocalAdapter({
  columns,
  data: users,
  state: createTableState({
    rowOrder: ["2", "1"],
    sorting: [{ columnId: "name", direction: "asc" }],
  }),
  getRowId: (row) => row.id,
});
```

## Remote Example

```ts
import { createRemoteAdapter } from "@typed-table/adapters";
import { createTableState } from "@typed-table/core";

const model = await createRemoteAdapter({
  columns,
  state: createTableState({
    pagination: { page: 0, pageSize: 25 },
  }),
  query: async ({ pagination, sorting, filters, grouping, rowExpansion }) => {
    const result = await fetchUsers({ pagination, sorting, filters, grouping, rowExpansion });

    return {
      rows: result.items,
      total: result.total,
    };
  },
  getRowId: (row) => row.id,
});
```

## Notes

- Local adapters honor visibility, column ordering, row ordering, pinning, grouping, and row expansion when enabled.
- Local row ordering is keyed by `getRowId(...)` and acts as a base order before later local sorting or grouping.
- Remote queries receive the ordered sorting descriptor list, active filters, grouping ids, and grouped row-expansion state.
- The remote adapter can normalize optional `groupedRows` and `faceting` metadata from the query result without taking over server-side query semantics.

## More

- Repository: <https://github.com/SiriusBinaryDev/typed-table>
- Package guide: <https://github.com/SiriusBinaryDev/typed-table/blob/main/docs/packages.md>


