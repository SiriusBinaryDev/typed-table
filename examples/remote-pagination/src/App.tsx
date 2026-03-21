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
  email: string;
  age: number;
};

const allUsers: User[] = Array.from({ length: 24 }, (_, index) => ({
  id: String(index + 1),
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  age: 20 + (index % 15),
}));

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true }),
  column("email", { header: "Email" }),
  column("age", { header: "Age", sortable: true }),
]);

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function fetchUsers(input: {
  page: number;
  pageSize: number;
  sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
}) {
  await sleep(250);

  const rows = [...allUsers];
  const sorting = input.sorting;

  if (sorting && sorting.length > 0) {
    rows.sort((left, right) => {
      for (const descriptor of sorting) {
        const leftValue = left[descriptor.columnId as keyof User];
        const rightValue = right[descriptor.columnId as keyof User];
        const result =
          typeof leftValue === "number" && typeof rightValue === "number"
            ? leftValue - rightValue
            : String(leftValue).localeCompare(String(rightValue));

        if (result !== 0) {
          return descriptor.direction === "asc" ? result : -result;
        }
      }

      return 0;
    });
  }

  const start = input.page * input.pageSize;

  return {
    items: rows.slice(start, start + input.pageSize),
    total: rows.length,
  };
}

function RemoteUsersTable() {
  const table = useTableContext<User>();
  const remoteSelection = table.remoteRowSelection;

  return (
    <div className="remote-stack">
      <section className="remote-panel remote-stats">
        <div>
          <span className="remote-stat-label">Dataset</span>
          <strong>{table.totalRows}</strong>
        </div>
        <div>
          <span className="remote-stat-label">Page size</span>
          <strong>{table.pageSize}</strong>
        </div>
        <div>
          <span className="remote-stat-label">Selected</span>
          <strong>{remoteSelection ? remoteSelection.selectedRowCount : table.selectedRowIds.length}</strong>
        </div>
        <div>
          <span className="remote-stat-label">Strategy</span>
          <strong>{remoteSelection ? remoteSelection.strategy : "page-only"}</strong>
        </div>
      </section>

      {remoteSelection ? (
        <section className="remote-panel remote-selection">
          <div className="remote-selection-copy">
            <span className="remote-stat-label">Remote selection</span>
            <p>
              Select all matching rows across the remote result set, then use row checkboxes as explicit exclusions.
            </p>
          </div>

          <div className="remote-selection-actions">
            <button
              className="remote-button"
              onClick={remoteSelection.selectAllMatchingRows}
              type="button"
            >
              Select all matching rows
            </button>
            <button
              className="remote-button remote-button-ghost"
              onClick={table.clearRowSelection}
              type="button"
            >
              Clear selection
            </button>
          </div>

          <div className="remote-selection-metrics">
            <span className={`remote-pill ${remoteSelection.allMatchingRowsSelected ? "is-active" : ""}`.trim()}>
              Mode: {remoteSelection.state.mode}
            </span>
            <span className="remote-pill">
              Included ids: {remoteSelection.state.includedIds.length}
            </span>
            <span className="remote-pill">
              Excluded ids: {remoteSelection.state.excludedIds.length}
            </span>
          </div>
        </section>
      ) : null}

      <section className="remote-panel remote-table-shell">
        <table className="remote-table">
          <thead>
            <tr>
              <th>Select</th>
              {table.headers.map((header) => (
                <th
                  key={header.id}
                  className={header.sortable ? "remote-sortable" : undefined}
                  onClick={(event) => table.sortBy(header.id, { multi: event.shiftKey })}
                >
                  <span className="remote-heading-cell">
                    {header.label}
                    {header.isSorted ? (
                      <span className="remote-sort-state">
                        {header.sortDirection} {header.sortIndex}
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id} className={row.isSelected ? "is-selected" : undefined}>
                <td>
                  <input
                    checked={row.isSelected}
                    onChange={() => table.toggleRowSelection(row.id)}
                    type="checkbox"
                  />
                </td>
                {row.cells.map((cell) => (
                  <td key={cell.id}>{String(cell.render())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="remote-footer">
        <div className="remote-pagination">
          <button
            className="remote-button"
            disabled={!table.canGoToPreviousPage}
            onClick={table.previousPage}
          >
            Previous
          </button>
          <span className="remote-page-indicator">
            Page {table.page + 1} / {Math.max(table.pageCount, 1)}
          </span>
          <button
            className="remote-button"
            disabled={!table.canGoToNextPage}
            onClick={table.nextPage}
          >
            Next
          </button>
        </div>

        <div className="remote-feedback">
          {table.loading ? <p className="remote-status is-loading">Loading fresh rows...</p> : null}
          {table.error ? <p className="remote-status is-error">{table.error.message}</p> : null}
          {!table.loading && !table.error ? (
            <p className="remote-status">Ready for the next query.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function App() {
  const table = useTable<User>({
    columns,
    mode: "remote",
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        page: 0,
        pageSize: 5,
      },
    },
    features: {
      sorting: true,
      pagination: true,
      rowSelection: true,
    },
    remoteRowSelection: {
      strategy: "all-except",
    },
    query: async ({ pagination, sorting }) => {
      const result = await fetchUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sorting,
      });

      return {
        rows: result.items,
        total: result.total,
      };
    },
  });

  return (
    <main className="remote-example">
      <header className="remote-hero">
        <p className="remote-eyebrow">Live query preview</p>
        <h1>Remote pagination example</h1>
        <p className="remote-lede">
          This demo simulates server-backed sorting and pagination with a short network delay, plus an optional remote selection strategy for dataset-level select-all behavior.
        </p>
      </header>

      <TableProvider table={table}>
        <RemoteUsersTable />
      </TableProvider>
    </main>
  );
}
