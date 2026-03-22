# typed-table

A headless, type-safe table state framework for React.

Build complex data tables with reusable logic, predictable state and flexible data integration.

## 🧠 The problem

Most table libraries focus on rendering UI.

But real-world tables are about:

* managing state (sorting, pagination, filters)
* handling data flows (local vs remote)
* composing multiple components (toolbar, table, pagination)

`typed-table` focuses on modeling those concerns — not just rendering them.

## ⚡ Why typed-table

* Strong TypeScript inference
* Headless architecture (no UI constraints)
* Reusable table state and logic
* Works with any data source (REST, GraphQL, React Query)
* Designed for complex applications

## Install

```bash
npm install @typed-table/core @typed-table/adapters @typed-table/react react
```

Use `@typed-table/core` when you want the framework-agnostic engine, or `@typed-table/adapters` when you want local or remote pipeline composition without the React hook.

## Quick example

```tsx
import { column, createColumns, useTable } from "@typed-table/react";

type User = {
  id: string;
  name: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true }),
  column("age", { header: "Age", sortable: true }),
]);

const table = useTable<User>({
  columns,
  data: users,
});
```

## Composition

```tsx
import { TableProvider } from "@typed-table/react";

function UsersPage() {
  return (
    <TableProvider table={table}>
      <UsersToolbar />
      <UsersTable />
      <UsersPagination />
    </TableProvider>
  );
}
```

`typed-table` is built for composability. Each component can consume the same table instance through context with `useTableContext()`.

## Demo / examples

- [`examples/basic-table`](./examples/basic-table) for local sorting, filtering, grouping, row ordering, selection, visibility, and sizing
- [`examples/filter-row-selection`](./examples/filter-row-selection) for context-driven composition, filtering, and selection workflows
- [`examples/remote-pagination`](./examples/remote-pagination) for remote pagination, sorting, grouping, faceting, and dataset-level selection
- [`examples/infinite-scroll`](./examples/infinite-scroll) for append-oriented remote loading

## Get started

### 1. Define your data

```ts
type User = {
  id: string;
  name: string;
  email: string;
  age: number;
};
```

### 2. Define columns

```ts
import { column, createColumns } from "@typed-table/react";

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true, filterable: true }),
  column("email", { header: "Email", filterable: true }),
  column("age", { header: "Age", sortable: true }),
]);
```

### 3. Create the table

```ts
import { useTable } from "@typed-table/react";

const table = useTable<User>({
  columns,
  data: users,
  getRowId: (row) => row.id,
});
```

### 4. Render the table

```tsx
import { useTableContext } from "@typed-table/react";

function UsersTable() {
  const table = useTableContext<User>();

  return (
    <table>
      <thead>
        <tr>
          {table.headers.map((header) => (
            <th key={header.id} onClick={() => table.sortBy(header.id)}>
              {header.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row.id}>
            {row.cells.map((cell) => (
              <td key={cell.id}>{cell.render()}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Data adapters

`typed-table` is data-source agnostic.

You can integrate with:

* REST APIs
* GraphQL
* React Query
* Custom data sources

### Example: server-side pagination

```ts
const table = useTable<User>({
  columns,
  mode: "remote",
  getRowId: (row) => row.id,
  query: async ({ pagination, sorting }) => {
    const response = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sorting,
      }),
    });

    const data = await response.json();

    return {
      rows: data.items,
      total: data.total,
    };
  },
});
```

### Example: React Query integration

```ts
const table = useTable<User>({
  columns,
  mode: "remote",
  getRowId: (row) => row.id,
  query: ({ pagination }) =>
    queryClient.fetchQuery({
      queryKey: ["users", pagination.page, pagination.pageSize],
      queryFn: () => fetchUsers(pagination.page, pagination.pageSize),
    }),
});
```

For non-React integrations, use [`@typed-table/adapters`](./packages/adapters) directly.

## Core principles

1. **Separation of concerns**  
   Types flow from your data to your UI.

2. **Explicit state model**  
   Table behavior is predictable and debuggable.

3. **End-to-end type safety**  
   Types flow from your data to your UI.

## Packages

- [`@typed-table/core`](./packages/core) → table engine (framework-agnostic)
- [`@typed-table/react`](./packages/react) → React bindings
- [`@typed-table/adapters`](./packages/adapters) → data integration layercomposition

## Architecture

```text
@typed-table/core
        ↓
@typed-table/react
        ↓
UI components

Data sources
REST / GraphQL / React Query
        ↓
@typed-table/adapters
```

## Comparison

| Feature                      | typed-table | Traditional table components |
| ---------------------------- | ----------- | ---------------------------- |
| Headless                     | ✅         | ❌                           |
| Type-safe                    | ✅         | ⚠️                           |
| Data-source agnostic         | ✅         | ❌                           |
| Composable across components | ✅         | ❌                           |
| Scalable architecture        | ✅         | ❌                           |

## Use cases

* SaaS dashboards
* admin panels
* analytics tools
* data-heavy applications

## Examples and docs

- [`examples/basic-table`](./examples/basic-table)
- [`examples/filter-row-selection`](./examples/filter-row-selection)
- [`examples/remote-pagination`](./examples/remote-pagination)
- [`examples/infinite-scroll`](./examples/infinite-scroll)
- [`docs/packages.md`](./docs/packages.md)
- [`docs/virtualization.md`](./docs/virtualization.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## Development

This repository uses npm workspaces and requires Node.js 22 or newer.

```bash
npm install
npm run build
npm test
```

Run the example apps:

```bash
npm run dev:basic
npm run dev:filter-selection
npm run dev:remote
npm run dev:infinite-scroll
```

Build all example apps:

```bash
npm run build:examples
```

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, workflow expectations, and pull request checks.

## License

Apache-2.0
