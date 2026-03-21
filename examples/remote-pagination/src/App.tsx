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
  team: string;
};

type RemoteSorting = { columnId: string; direction: "asc" | "desc" }[] | null;

type RemoteGroupedRow = {
  type: "group";
  id: string;
  groupingColumnId: string;
  groupingValue: unknown;
  leafRowCount: number;
  subRows: { original: User }[];
};

const teams = ["Platform", "Research", "Systems"] as const;

const allUsers: User[] = Array.from({ length: 24 }, (_, index) => ({
  id: String(index + 1),
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  age: 20 + (index % 15),
  team: teams[index % teams.length]!,
}));

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true }),
  column("team", { header: "Team", sortable: true, filterable: true }),
  column("email", { header: "Email" }),
  column("age", { header: "Age", sortable: true, filterable: true }),
]);

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

function compareUsers(left: User, right: User, sorting: RemoteSorting): number {
  if (!sorting || sorting.length === 0) {
    return 0;
  }

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
}

function buildTeamGroups(
  rows: readonly User[],
  rowExpansion: Record<string, boolean>,
): { groupedRows: RemoteGroupedRow[]; total: number } {
  const groupedRows = teams.flatMap((team) => {
    const teamRows = rows.filter((row) => row.team === team);

    if (teamRows.length === 0) {
      return [];
    }

    const groupId = `group:team=${team}`;
    const collapsed = rowExpansion[groupId] === false;

    return [{
      type: "group" as const,
      id: groupId,
      groupingColumnId: "team",
      groupingValue: team,
      leafRowCount: teamRows.length,
      subRows: collapsed
        ? []
        : teamRows.map((row) => ({ original: row })),
    }];
  });

  const total = groupedRows.reduce(
    (count, group) => count + 1 + group.subRows.length,
    0,
  );

  return { groupedRows, total };
}

function getRemoteFaceting(rows: readonly User[]) {
  return {
    uniqueValues: {
      team: teams
        .map((team) => ({
          value: team,
          count: rows.filter((row) => row.team === team).length,
        }))
        .filter((entry) => entry.count > 0),
    },
    minMaxValues: {
      age: rows.length > 0
        ? {
            min: Math.min(...rows.map((row) => row.age)),
            max: Math.max(...rows.map((row) => row.age)),
          }
        : null,
    },
  };
}

async function fetchUsers(input: {
  page: number;
  pageSize: number;
  sorting: RemoteSorting;
  grouping: string[];
  rowExpansion: Record<string, boolean>;
}) {
  await sleep(250);

  const rows = [...allUsers].sort((left, right) => compareUsers(left, right, input.sorting));

  if (input.grouping.includes("team")) {
    const grouped = buildTeamGroups(rows, input.rowExpansion);

    return {
      rows: [] as User[],
      total: grouped.total,
      groupedRows: grouped.groupedRows,
      faceting: getRemoteFaceting(rows),
    };
  }

  const start = input.page * input.pageSize;

  return {
    rows: rows.slice(start, start + input.pageSize),
    total: rows.length,
    faceting: getRemoteFaceting(rows),
  };
}

function formatCellValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value == null) {
    return "";
  }

  return String(value);
}

function RemoteUsersTable() {
  const table = useTableContext<User>();
  const remoteSelection = table.remoteRowSelection;
  const teamFacet = table.getFacetedUniqueValues("team");
  const ageFacet = table.getFacetedMinMaxValues("age");
  const groupedByTeam = table.grouping.includes("team");

  return (
    <div className="remote-stack">
      <section className="remote-panel remote-stats">
        <div>
          <span className="remote-stat-label">Visible rows</span>
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
          <span className="remote-stat-label">Grouping</span>
          <strong>{groupedByTeam ? "team" : "none"}</strong>
        </div>
      </section>

      <section className="remote-panel remote-controls">
        <div>
          <span className="remote-stat-label">Server grouping</span>
          <p className="remote-copy">
            Toggle remote grouping by team. The server returns grouped rows plus facet metadata, while column pinning, sizing, and rendering stay local.
          </p>
        </div>

        <div className="remote-selection-actions">
          <button
            className="remote-button"
            onClick={() => table.toggleGrouping("team")}
            type="button"
          >
            {groupedByTeam ? "Ungroup team" : "Group by team"}
          </button>
          <button
            className="remote-button remote-button-ghost"
            onClick={table.clearRowExpansion}
            type="button"
          >
            Expand all groups
          </button>
        </div>
      </section>

      <section className="remote-panel remote-facets">
        <div>
          <span className="remote-stat-label">Server facets</span>
          <p className="remote-copy">
            These counts and ranges come directly from the remote query result instead of being derived from the currently loaded rows in the browser.
          </p>
        </div>

        <div className="remote-selection-metrics">
          {teamFacet.map((entry) => (
            <span key={String(entry.value)} className="remote-pill">
              {String(entry.value)}: {entry.count}
            </span>
          ))}
          {ageFacet ? (
            <span className="remote-pill">
              Age range: {ageFacet.min} - {ageFacet.max}
            </span>
          ) : null}
        </div>
      </section>

      {remoteSelection ? (
        <section className="remote-panel remote-selection">
          <div className="remote-selection-copy">
            <span className="remote-stat-label">Remote selection</span>
            <p>
              Select all matching rows across the remote result set, then use row checkboxes as explicit exclusions. Sorting and grouping changes reset the dataset scope in this demo.
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
              <th>Action</th>
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
                  {row.type === "group" ? (
                    <button
                      className="remote-group-toggle"
                      onClick={() => table.toggleRowExpanded(row.id)}
                      type="button"
                    >
                      {row.isExpanded ? "Collapse" : "Expand"}
                    </button>
                  ) : (
                    <input
                      checked={row.isSelected}
                      onChange={() => table.toggleRowSelection(row.id)}
                      type="checkbox"
                    />
                  )}
                </td>
                {row.cells.map((cell) => {
                  const isGroupingCell = row.type === "group" && cell.columnId === row.groupingColumnId;

                  return (
                    <td key={cell.id}>
                      <div
                        className={`remote-cell-content ${row.type === "group" ? "is-group" : ""}`.trim()}
                        style={{ paddingLeft: `${row.depth * 18}px` }}
                      >
                        {isGroupingCell ? (
                          <>
                            <strong>{formatCellValue(cell.render())}</strong>
                            <span className="remote-group-count">{row.leafRowCount} rows</span>
                          </>
                        ) : row.type === "group" ? (
                          <span className="remote-empty">-</span>
                        ) : (
                          formatCellValue(cell.render())
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="remote-footer">
        <div className="remote-pagination">
          <button
            className="remote-button"
            disabled={!table.canGoToPreviousPage || groupedByTeam}
            onClick={table.previousPage}
          >
            Previous
          </button>
          <span className="remote-page-indicator">
            Page {table.page + 1} / {Math.max(table.pageCount, 1)}
          </span>
          <button
            className="remote-button"
            disabled={!table.canGoToNextPage || groupedByTeam}
            onClick={table.nextPage}
          >
            Next
          </button>
        </div>

        <div className="remote-feedback">
          {table.loading ? <p className="remote-status is-loading">Loading fresh rows...</p> : null}
          {table.error ? <p className="remote-status is-error">{table.error.message}</p> : null}
          {!table.loading && !table.error ? (
            <p className="remote-status">
              {groupedByTeam
                ? "Server grouping is active; pagination is paused for the grouped view."
                : "Ready for the next query."}
            </p>
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
      grouping: true,
      rowExpansion: true,
      filtering: true,
    },
    remoteRowSelection: {
      strategy: "all-except",
      resetOnQueryChange: true,
    },
    query: async ({ pagination, sorting, grouping, rowExpansion }) =>
      fetchUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sorting,
        grouping,
        rowExpansion,
      }),
  });

  return (
    <main className="remote-example">
      <header className="remote-hero">
        <p className="remote-eyebrow">Live query preview</p>
        <h1>Remote grouping and faceting example</h1>
        <p className="remote-lede">
          This demo simulates server-backed sorting, pagination, grouping, and faceting with a short network delay. Group rows and facet counts come from the remote query, while rendering and layout behavior stay headless on the client.
        </p>
      </header>

      <TableProvider table={table}>
        <RemoteUsersTable />
      </TableProvider>
    </main>
  );
}
