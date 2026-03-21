# @typed-table/react

React integration for `typed-table`.

## Installation

```bash
npm install @typed-table/react react
```

## What It Provides

- `useTable`
- `TableProvider`
- `useTableContext`
- typed column helpers re-exported from the core package
- local and remote table workflows with partial controlled state support

## Example

```tsx
import { column, createColumns, useTable } from "@typed-table/react";

type User = {
  id: string;
  name: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true, filterable: true }),
  column("age", { header: "Age", sortable: true }),
]);

export function UsersTable({ users }: { users: User[] }) {
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
    <table>
      <thead>
        <tr>
          {table.headers.map((header) => (
            <th key={header.id}>{header.label}</th>
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
```

## Remote Features

- `mode: "remote"` forwards pagination, sorting, and filters to your query function.
- `remoteLoading: { mode: "append" }` supports append-oriented remote loading.
- Optional dataset-level include/exclude selection is available through `remoteRowSelection`.

## Notes

- Grouping, grouped-row expansion, and faceted metadata are currently local-table features.
- Visibility, ordering, and pinning changes in remote mode stay local and do not refetch.
- Hidden columns do not automatically clear active sorting or filtering state.

## More

- Repository: <https://github.com/SiriusBinaryDev/typed-table>
- Package guide: <https://github.com/SiriusBinaryDev/typed-table/blob/main/docs/packages.md>
