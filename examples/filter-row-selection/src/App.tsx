import {
  TableProvider,
  column,
  createColumns,
  useTable,
  useTableContext,
} from "@typed-table/react";

type TicketStatus = "new" | "active" | "closed";
type TicketPriority = "low" | "medium" | "high";

type Ticket = {
  id: string;
  customer: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
};

const tickets: Ticket[] = [
  {
    id: "T-1001",
    customer: "Acme Labs",
    status: "new",
    priority: "high",
    assignee: "Nina",
  },
  {
    id: "T-1002",
    customer: "Bluebird Health",
    status: "active",
    priority: "medium",
    assignee: "Jules",
  },
  {
    id: "T-1003",
    customer: "Compass Retail",
    status: "closed",
    priority: "low",
    assignee: "Rory",
  },
  {
    id: "T-1004",
    customer: "Delta Finance",
    status: "active",
    priority: "high",
    assignee: "Nina",
  },
  {
    id: "T-1005",
    customer: "Evergreen Energy",
    status: "new",
    priority: "medium",
    assignee: "Jules",
  },
  {
    id: "T-1006",
    customer: "Foundry Logistics",
    status: "closed",
    priority: "medium",
    assignee: "Mika",
  },
  {
    id: "T-1007",
    customer: "Granite Media",
    status: "active",
    priority: "low",
    assignee: "Mika",
  },
  {
    id: "T-1008",
    customer: "Harbor Telecom",
    status: "new",
    priority: "high",
    assignee: "Rory",
  },
];

const columns = createColumns<Ticket>([
  column("customer", { header: "Customer", sortable: true, filterable: true }),
  column("status", {
    header: "Status",
    filterable: true,
    filterFn: (value, filterValue) => filterValue === "" || value === filterValue,
  }),
  column("priority", {
    header: "Priority",
    sortable: true,
    filterable: true,
    filterFn: (value, filterValue) => filterValue === "" || value === filterValue,
  }),
  column("assignee", { header: "Assignee", filterable: true }),
]);

function isActiveFilter(value: unknown): boolean {
  return value != null && value !== "";
}

function renderTicketCell(columnId: string, value: unknown) {
  if (columnId === "status") {
    return <span className={`filter-chip status-${String(value)}`}>{String(value)}</span>;
  }

  if (columnId === "priority") {
    return <span className={`filter-chip priority-${String(value)}`}>{String(value)}</span>;
  }

  return String(value);
}

function FilterToolbar() {
  const table = useTableContext<Ticket>();
  const hasFilters = Object.values(table.filters).some((value) => isActiveFilter(value));

  return (
    <section className="filter-toolbar-card">
      <div className="filter-grid">
        <label className="filter-field">
          <span className="filter-field-label">Customer</span>
          <input
            className="filter-input"
            value={String(table.filters.customer ?? "")}
            onChange={(event) => table.setFilter("customer", event.target.value)}
            placeholder="Search customer"
          />
        </label>

        <label className="filter-field">
          <span className="filter-field-label">Status</span>
          <select
            className="filter-select"
            value={String(table.filters.status ?? "")}
            onChange={(event) => table.setFilter("status", event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-field-label">Assignee</span>
          <input
            className="filter-input"
            value={String(table.filters.assignee ?? "")}
            onChange={(event) => table.setFilter("assignee", event.target.value)}
            placeholder="Filter by assignee"
          />
        </label>

        <label className="filter-field">
          <span className="filter-field-label">Priority</span>
          <select
            className="filter-select"
            value={String(table.filters.priority ?? "")}
            onChange={(event) => table.setFilter("priority", event.target.value)}
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>

      <div className="filter-toolbar-actions">
        <button className="filter-button" disabled={!hasFilters} onClick={table.clearFilters}>
          Clear filters
        </button>
        <span className="filter-meta">Matching tickets: {table.totalRows}</span>
      </div>
    </section>
  );
}

function SelectionSummary() {
  const table = useTableContext<Ticket>();
  const selectedTickets = tickets.filter((ticket) => table.selectedRowIds.includes(ticket.id));

  return (
    <section className="selection-card">
      <div className="selection-header">
        <strong>Selected tickets: {selectedTickets.length}</strong>
        <button
          className="filter-button secondary"
          disabled={selectedTickets.length === 0}
          onClick={table.clearRowSelection}
        >
          Clear selection
        </button>
      </div>

      {selectedTickets.length > 0 ? (
        <ul className="selection-list">
          {selectedTickets.map((ticket) => (
            <li key={ticket.id}>
              <span className="selection-ticket-id">{ticket.id}</span>
              <span>
                {ticket.customer} ({ticket.status})
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="selection-empty">
          Select rows to keep track of tickets across filters and pages.
        </p>
      )}
    </section>
  );
}

function TicketsTable() {
  const table = useTableContext<Ticket>();

  return (
    <section className="filter-table-card">
      <table className="filter-table">
        <thead>
          <tr>
            <th>Select</th>
            {table.headers.map((header) => (
              <th
                key={header.id}
                className={header.sortable ? "filter-sortable" : undefined}
                onClick={() => table.sortBy(header.id)}
              >
                <span className="filter-heading-cell">
                  {header.label}
                  {header.isSorted ? (
                    <span className="filter-sort-state">{header.sortDirection} {header.sortIndex}</span>
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
                  type="checkbox"
                  onChange={() => table.toggleRowSelection(row.id)}
                />
              </td>
              {row.cells.map((cell) => (
                <td key={cell.id}>{renderTicketCell(cell.columnId, cell.render())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="filter-pagination">
        <label className="filter-page-size">
          <span>Page size</span>
          <select
            className="filter-select"
            value={String(table.pageSize)}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
          </select>
        </label>

        <div className="filter-pagination-controls">
          <button
            className="filter-button"
            disabled={!table.canGoToPreviousPage}
            onClick={table.previousPage}
          >
            Previous
          </button>
          <span className="filter-meta">
            Page {table.page + 1} / {Math.max(table.pageCount, 1)}
          </span>
          <button
            className="filter-button"
            disabled={!table.canGoToNextPage}
            onClick={table.nextPage}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export function App() {
  const table = useTable<Ticket>({
    columns,
    data: tickets,
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        page: 0,
        pageSize: 4,
      },
    },
    features: {
      sorting: true,
      filtering: true,
      pagination: true,
      rowSelection: true,
    },
  });

  return (
    <main className="filter-example">
      <header className="filter-hero">
        <p className="filter-eyebrow">Support desk dashboard</p>
        <h1>Filtering and row selection</h1>
        <p className="filter-lede">
          Split components coordinated by <code>TableProvider</code> and <code>useTableContext</code>. Shift-click headers to build a multi-sort stack.
        </p>
      </header>

      <TableProvider table={table}>
        <FilterToolbar />
        <SelectionSummary />
        <TicketsTable />
      </TableProvider>
    </main>
  );
}

