import { useEffect, useEffectEvent, useRef } from "react";

import {
  TableProvider,
  column,
  createColumns,
  useTable,
  useTableContext,
} from "@typed-table/react";

type Profile = {
  id: string;
  name: string;
  role: string;
  region: string;
  score: number;
};

const allProfiles: Profile[] = Array.from({ length: 60 }, (_, index) => ({
  id: String(index + 1),
  name: `Operator ${index + 1}`,
  role: ["Analyst", "Support", "Planner", "Ops"][(index * 3) % 4] ?? "Analyst",
  region: ["Madrid", "Berlin", "Austin", "Seoul"][(index * 5) % 4] ?? "Madrid",
  score: 520 + ((index * 19) % 430),
}));

const columns = createColumns<Profile>([
  column("name", { header: "Name", sortable: true }),
  column("role", { header: "Role", sortable: true }),
  column("region", { header: "Region", sortable: true }),
  column("score", { header: "Score", sortable: true }),
]);

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function fetchProfiles(input: {
  page: number;
  pageSize: number;
  sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
}) {
  await sleep(260);

  const rows = [...allProfiles];

  if (input.sorting && input.sorting.length > 0) {
    rows.sort((left, right) => {
      for (const descriptor of input.sorting) {
        const leftValue = left[descriptor.columnId as keyof Profile];
        const rightValue = right[descriptor.columnId as keyof Profile];
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

function InfiniteProfilesTable() {
  const table = useTableContext<Profile>();
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const onIntersect = useEffectEvent((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];

    if (!entry?.isIntersecting || table.loading || !table.canGoToNextPage) {
      return;
    }

    table.nextPage();
  });

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => onIntersect(entries),
      {
        root,
        rootMargin: "0px 0px 140px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onIntersect, table.canGoToNextPage, table.loading, table.page]);

  const loadedAllRows = table.rows.length >= table.totalRows && table.totalRows > 0;
  const loadingLabel = table.loading && table.rows.length > 0
    ? "Loading the next slice..."
    : table.loading
      ? "Loading initial rows..."
      : loadedAllRows
        ? "All rows loaded."
        : "Scroll near the bottom to fetch the next page.";

  return (
    <div className="infinite-stack">
      <section className="infinite-panel infinite-stats">
        <div>
          <span className="infinite-stat-label">Loaded</span>
          <strong>{table.rows.length}</strong>
        </div>
        <div>
          <span className="infinite-stat-label">Dataset</span>
          <strong>{table.totalRows}</strong>
        </div>
        <div>
          <span className="infinite-stat-label">Page size</span>
          <strong>{table.pageSize}</strong>
        </div>
        <div>
          <span className="infinite-stat-label">Active page</span>
          <strong>{table.page + 1}</strong>
        </div>
      </section>

      <section className="infinite-panel infinite-explainer">
        <p>
          This demo keeps the existing page-based remote query contract, but switches the hook into append mode so each sequential page load accumulates rows for an infinite-scroll workflow.
        </p>
        <p>
          Sorting still resets back to page one because it changes the remote query scope.
        </p>
      </section>

      <section className="infinite-panel infinite-table-card">
        <div className="infinite-scroll-shell" ref={scrollRootRef}>
          <table className="infinite-table">
            <thead>
              <tr>
                {table.headers.map((header) => (
                  <th
                    key={header.id}
                    className={header.sortable ? "infinite-sortable" : undefined}
                    onClick={(event) => table.sortBy(header.id, { multi: event.shiftKey })}
                  >
                    <span className="infinite-heading-cell">
                      {header.label}
                      {header.isSorted ? (
                        <span className="infinite-sort-state">
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
                <tr key={row.id}>
                  {row.cells.map((cell) => (
                    <td key={cell.id}>{String(cell.render())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="infinite-sentinel" ref={sentinelRef}>
            <p className={`infinite-status ${table.error ? "is-error" : table.loading ? "is-loading" : ""}`.trim()}>
              {table.error ? table.error.message : loadingLabel}
            </p>
            <button
              className="infinite-button"
              disabled={table.loading || !table.canGoToNextPage}
              onClick={table.nextPage}
              type="button"
            >
              {loadedAllRows ? "Loaded all rows" : "Load next page"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function App() {
  const table = useTable<Profile>({
    columns,
    mode: "remote",
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        page: 0,
        pageSize: 12,
      },
    },
    features: {
      sorting: true,
      pagination: true,
    },
    remoteLoading: {
      mode: "append",
    },
    query: async ({ pagination, sorting }) => {
      const result = await fetchProfiles({
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
    <main className="infinite-example">
      <header className="infinite-hero">
        <p className="infinite-eyebrow">Remote append mode</p>
        <h1>Infinite scroll example</h1>
        <p className="infinite-lede">
          Scroll inside the feed to append the next remote page. The hook keeps prior rows in memory until the query scope changes, which gives the example infinite-scroll behavior without changing the server query shape.
        </p>
      </header>

      <TableProvider table={table}>
        <InfiniteProfilesTable />
      </TableProvider>
    </main>
  );
}
