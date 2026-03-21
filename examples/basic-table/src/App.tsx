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
  team: string;
  age: number;
};

const users: User[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", team: "Research", age: 36 },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", team: "Platform", age: 44 },
  { id: "3", name: "Katherine Johnson", email: "katherine@example.com", team: "Research", age: 50 },
  { id: "4", name: "Edsger Dijkstra", email: "edsger@example.com", team: "Platform", age: 42 },
  { id: "5", name: "Margaret Hamilton", email: "margaret@example.com", team: "Systems", age: 39 },
  { id: "6", name: "Barbara Liskov", email: "barbara@example.com", team: "Research", age: 47 },
  { id: "7", name: "Donald Knuth", email: "donald@example.com", team: "Platform", age: 46 },
  { id: "8", name: "Radia Perlman", email: "radia@example.com", team: "Systems", age: 43 },
];

const columns = createColumns<User>([
  column("name", {
    header: "Name",
    sortable: true,
    filterable: true,
    size: 220,
    minSize: 180,
  }),
  column("email", {
    header: "Email",
    filterable: true,
    size: 280,
    minSize: 220,
  }),
  column("team", {
    header: "Team",
    sortable: true,
    size: 160,
    minSize: 120,
  }),
  column("age", {
    header: "Age",
    sortable: true,
    size: 96,
    minSize: 72,
    maxSize: 132,
  }),
]);

const columnOptions = columns.map((column) => ({
  id: column.id,
  label: column.header,
}));

const groupingOptions = columnOptions.filter(
  (column) => column.id === "team" || column.id === "age",
);

const columnLabelById = Object.fromEntries(
  columnOptions.map((column) => [column.id, column.label]),
) as Record<string, string>;

function formatValue(value: unknown): string {
  return value == null ? "Empty" : String(value);
}

function UsersTable() {
  const table = useTableContext<User>();
  const visibleColumnCount = columnOptions.filter(
    (column) => table.columnVisibility[column.id] ?? true,
  ).length;
  const collapsedGroupCount = Object.values(table.rowExpansion).filter(
    (expanded) => expanded === false,
  ).length;
  const activeGrouping = table.grouping.length
    ? table.grouping.map((columnId) => columnLabelById[columnId] ?? columnId).join(" -> ")
    : "None";

  return (
    <div className="basic-stack">
      <section className="basic-panel basic-panel-soft basic-controls">
        <label className="basic-field">
          <span className="basic-field-label">Filter by name</span>
          <input
            className="basic-input"
            value={String(table.filters.name ?? "")}
            onChange={(event) => table.setFilter("name", event.target.value)}
            placeholder="Search users"
          />
        </label>

        <div className="basic-kpis">
          <div className="basic-kpi">
            <span className="basic-kpi-label">Page rows</span>
            <strong>{table.rows.length}</strong>
          </div>
          <div className="basic-kpi">
            <span className="basic-kpi-label">Visible columns</span>
            <strong>{visibleColumnCount}</strong>
          </div>
          <div className="basic-kpi">
            <span className="basic-kpi-label">Group levels</span>
            <strong>{table.grouping.length}</strong>
          </div>
          <div className="basic-kpi">
            <span className="basic-kpi-label">Selected</span>
            <strong>{table.selectedRowIds.length}</strong>
          </div>
        </div>

        <div className="basic-column-controls">
          <div className="basic-inline-header">
            <span className="basic-field-label">Columns</span>
            <button
              className="basic-text-button"
              onClick={table.clearColumnVisibility}
              type="button"
            >
              Show all
            </button>
          </div>

          <div className="basic-chip-row">
            {columnOptions.map((column) => {
              const isVisible = table.columnVisibility[column.id] ?? true;

              return (
                <label
                  key={column.id}
                  className={`basic-chip ${isVisible ? "" : "is-muted"}`.trim()}
                >
                  <input
                    checked={isVisible}
                    onChange={() => table.setColumnVisibility(column.id, !isVisible)}
                    type="checkbox"
                  />
                  <span>{column.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="basic-column-controls">
          <div className="basic-inline-header">
            <span className="basic-field-label">Column widths</span>
            <button
              className="basic-text-button"
              onClick={table.clearColumnSizing}
              type="button"
            >
              Reset widths
            </button>
          </div>

          <div className="basic-chip-row basic-size-grid">
            {table.headers.map((header) => (
              <div key={header.id} className="basic-size-card">
                <div className="basic-size-card-header">
                  <strong>{header.label}</strong>
                  <span className="basic-chip-meta">{header.size}px</span>
                </div>
                <div className="basic-size-actions">
                  <button
                    className="basic-size-button"
                    disabled={!header.canResize}
                    onClick={() => table.resizeColumn(header.id, -24)}
                    type="button"
                  >
                    -24
                  </button>
                  <button
                    className="basic-size-button"
                    disabled={!header.canResize}
                    onClick={() => table.resizeColumn(header.id, 24)}
                    type="button"
                  >
                    +24
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="basic-helper">
            Widths are headless numeric state on headers and cells. This demo steps each visible
            column by 24px.
          </p>
        </div>

        <div className="basic-column-controls">
          <div className="basic-inline-header">
            <span className="basic-field-label">Grouping</span>
            <div className="basic-inline-actions">
              <button
                className="basic-text-button"
                onClick={table.clearGrouping}
                type="button"
              >
                Clear groups
              </button>
              <button
                className="basic-text-button"
                disabled={collapsedGroupCount === 0}
                onClick={table.clearRowExpansion}
                type="button"
              >
                Expand all
              </button>
            </div>
          </div>

          <div className="basic-chip-row">
            {groupingOptions.map((column) => {
              const groupIndex = table.grouping.indexOf(column.id);
              const isGrouped = groupIndex >= 0;

              return (
                <button
                  key={column.id}
                  className={`basic-chip basic-chip-button ${isGrouped ? "is-active" : ""}`.trim()}
                  onClick={() => table.toggleGrouping(column.id)}
                  type="button"
                >
                  <span>{column.label}</span>
                  <span className="basic-chip-meta">{isGrouped ? groupIndex + 1 : "Add"}</span>
                </button>
              );
            })}
          </div>

          <p className="basic-helper">
            Active grouping: <strong>{activeGrouping}</strong>. Collapsed groups: {collapsedGroupCount}.
          </p>
        </div>
      </section>

      <section className="basic-panel basic-table-shell">
        <table className="basic-table">
          <colgroup>
            <col style={{ width: "72px" }} />
            {table.headers.map((header) => (
              <col key={header.id} style={{ width: `${header.size}px` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th>Select</th>
              {table.headers.map((header) => (
                <th
                  key={header.id}
                  className={header.sortable ? "basic-sortable" : undefined}
                  onClick={(event) =>
                    table.sortBy(header.id, { multi: event.shiftKey })
                  }
                >
                  <span className="basic-heading-cell">
                    <span>{header.label}</span>
                    {table.grouping.includes(header.id) ? (
                      <span className="basic-group-badge">
                        Group {table.grouping.indexOf(header.id) + 1}
                      </span>
                    ) : null}
                    <span className="basic-width-badge">{header.size}px</span>
                    {header.isSorted ? (
                      <span className="basic-sort-state">
                        {header.sortDirection} {header.sortIndex}
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => {
              if (row.type === "group") {
                return (
                  <tr key={row.id} className="basic-group-row">
                    <td />
                    <td colSpan={table.headers.length}>
                      <button
                        className="basic-group-toggle"
                        onClick={() => table.toggleRowExpanded(row.id)}
                        style={{ paddingInlineStart: `${row.depth * 18 + 10}px` }}
                        type="button"
                      >
                        <span className="basic-group-chevron">
                          {row.isExpanded ? "-" : "+"}
                        </span>
                        <span className="basic-group-summary">
                          <strong>{columnLabelById[row.groupingColumnId ?? ""] ?? row.groupingColumnId}</strong>
                          <span>{formatValue(row.groupingValue)}</span>
                        </span>
                        <span className="basic-group-count">{row.leafRowCount} rows</span>
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.id} className={row.isSelected ? "is-selected" : undefined}>
                  <td>
                    <input
                      checked={row.isSelected}
                      type="checkbox"
                      onChange={() => table.toggleRowSelection(row.id)}
                    />
                  </td>
                  {row.cells.map((cell, index) => (
                    <td key={cell.id}>
                      {index === 0 && row.depth > 0 ? (
                        <span
                          className="basic-cell-indent"
                          style={{ paddingInlineStart: `${row.depth * 18}px` }}
                        >
                          {String(cell.render())}
                        </span>
                      ) : (
                        String(cell.render())
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="basic-pagination">
        <button
          className="basic-button"
          disabled={!table.canGoToPreviousPage}
          onClick={table.previousPage}
          type="button"
        >
          Previous
        </button>
        <span className="basic-page-indicator">
          Page {table.page + 1} / {Math.max(table.pageCount, 1)}
        </span>
        <button
          className="basic-button"
          disabled={!table.canGoToNextPage}
          onClick={table.nextPage}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function App() {
  const table = useTable<User>({
    columns,
    data: users,
    getRowId: (row) => row.id,
    initialState: {
      grouping: ["team"],
      pagination: {
        page: 0,
        pageSize: 8,
      },
    },
    features: {
      sorting: true,
      filtering: true,
      pagination: true,
      grouping: true,
      rowExpansion: true,
      rowSelection: true,
      columnVisibility: true,
      columnResizing: true,
    },
  });

  return (
    <main className="basic-example">
      <section className="basic-hero">
        <p className="basic-eyebrow">typed-table</p>
        <h1>Basic example</h1>
        <p className="basic-lede">
          A compact people table with filtering, sorting, grouping, expandable grouped rows,
          pagination, row selection, column visibility, and host-rendered column sizing. Shift-click
          headers to add secondary sorts.
        </p>
      </section>

      <TableProvider table={table}>
        <UsersTable />
      </TableProvider>
    </main>
  );
}