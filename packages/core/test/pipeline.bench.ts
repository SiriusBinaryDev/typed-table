import { bench, describe } from "vitest";

import {
  applyFilters,
  applyPagination,
  applySorting,
  column,
  createColumnFactory,
  createColumns,
  createGroupedRows,
  createRows,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getOrderedColumns,
  getVisibleColumns,
} from "@typed-table/core";

type BenchmarkRow = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  active: boolean;
  score: number;
  department: string;
  tags: string[];
};

const departments = ["Engineering", "Design", "Support", "Operations"];
const tags = ["alpha", "beta", "gamma", "delta", "omega"];

const rows: BenchmarkRow[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: String(index + 1),
  firstName: `User${index % 700}`,
  lastName: `Person${(index * 7) % 1_300}`,
  age: 18 + (index % 47),
  active: index % 3 !== 0,
  score: (index * 17) % 10_000,
  department: departments[index % departments.length] ?? departments[0],
  tags: [
    tags[index % tags.length] ?? tags[0],
    tags[(index + 2) % tags.length] ?? tags[0],
  ],
}));

const { column: typedColumn } = createColumnFactory<BenchmarkRow>();

const columns = createColumns<BenchmarkRow>([
  column("firstName", { sortable: true, filterable: true }),
  column("lastName", { sortable: true, filterable: true }),
  column("age", { sortable: true, filterable: true }),
  column("active", { filterable: true }),
  column("department", { sortable: true, filterable: true }),
  column("tags", { filterable: true }),
  typedColumn("fullName", {
    accessor: (row) => `${row.firstName} ${row.lastName}`,
    sortable: true,
    filterable: true,
  }),
  typedColumn("scoreBand", {
    accessor: (row) => Math.floor(row.score / 100),
    sortable: true,
    filterable: true,
  }),
]);

const filters = {
  department: "Engineering",
  active: true,
  fullName: "User1",
};

const sorting = [
  { columnId: "department", direction: "asc" as const },
  { columnId: "scoreBand", direction: "desc" as const },
  { columnId: "fullName", direction: "asc" as const },
];

const rowSelection = Object.fromEntries(
  rows.filter((_, index) => index % 40 === 0).map((row) => [row.id, true]),
);

const columnVisibility = {
  active: false,
};

const columnOrder = [
  "department",
  "fullName",
  "firstName",
  "lastName",
  "age",
  "scoreBand",
  "tags",
  "active",
];

const columnPinning = {
  department: "left",
  fullName: "left",
  tags: "right",
} as const;

const grouping = ["department", "scoreBand"] as const;
const visibleColumns = getVisibleColumns(columns, columnVisibility);
const orderedVisibleColumns = getOrderedColumns(
  visibleColumns,
  columnOrder,
  columnPinning,
);
const filteredRows = applyFilters(rows, filters, columns);
const sortedRows = applySorting(filteredRows, sorting, columns);
const groupedRowsOptions = {
  allColumns: columns,
  visibleColumns: orderedVisibleColumns,
  grouping,
  columnPinning,
  rowSelection,
  rowExpansion: {},
  getRowId: (row: BenchmarkRow) => row.id,
};

describe("core pipeline benchmarks", () => {
  bench("applyFilters over 10k rows", () => {
    applyFilters(rows, filters, columns);
  });

  bench("getFacetedUniqueValues over 10k rows with active sibling filters", () => {
    getFacetedUniqueValues(rows, "tags", columns, filters);
  });

  bench("getFacetedMinMaxValues over 10k rows with active sibling filters", () => {
    getFacetedMinMaxValues(rows, "scoreBand", columns, filters);
  });

  bench("applySorting over 10k rows with three descriptors", () => {
    applySorting(rows, sorting, columns);
  });

  bench("applyPagination over a filtered and sorted result", () => {
    const filtered = applyFilters(rows, filters, columns);
    const sorted = applySorting(filtered, sorting, columns);

    applyPagination(sorted, {
      page: 4,
      pageSize: 50,
    });
  });

  bench("createRows for one visible page", () => {
    const filtered = applyFilters(rows, filters, columns);
    const sorted = applySorting(filtered, sorting, columns);
    const paged = applyPagination(sorted, {
      page: 0,
      pageSize: 50,
    });

    createRows(paged, {
      columns,
      getRowId: (row) => row.id,
      rowSelection,
    });
  });

  bench("createGroupedRows over a filtered and sorted result", () => {
    createGroupedRows(sortedRows, groupedRowsOptions);
  });

  bench("full local grouped pipeline with faceting and layout transforms", () => {
    const currentVisibleColumns = getVisibleColumns(columns, columnVisibility);
    const currentOrderedVisibleColumns = getOrderedColumns(
      currentVisibleColumns,
      columnOrder,
      columnPinning,
    );

    getFacetedUniqueValues(rows, "tags", columns, filters);
    getFacetedMinMaxValues(rows, "scoreBand", columns, filters);

    const filtered = applyFilters(rows, filters, columns);
    const sorted = applySorting(filtered, sorting, columns);
    const grouped = createGroupedRows(sorted, {
      allColumns: columns,
      visibleColumns: currentOrderedVisibleColumns,
      grouping,
      columnPinning,
      rowSelection,
      rowExpansion: {},
      getRowId: (row) => row.id,
    });

    applyPagination(grouped.rows, {
      page: 2,
      pageSize: 50,
    });
  });

  bench("full local pipeline from raw rows to rendered rows", () => {
    const filtered = applyFilters(rows, filters, columns);
    const sorted = applySorting(filtered, sorting, columns);
    const paged = applyPagination(sorted, {
      page: 2,
      pageSize: 50,
    });

    createRows(paged, {
      columns,
      getRowId: (row) => row.id,
      rowSelection,
    });
  });
});



