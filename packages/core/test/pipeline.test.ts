import { describe, expect, it } from "vitest";

import {
  applyFilters,
  applyPagination,
  applySorting,
  column,
  createColumnFactory,
  createColumns,
  createHeaders,
  createRows,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
  active: boolean;
  roles: string[];
};

const users: User[] = [
  { id: "1", name: "Ada", age: 36, active: true, roles: ["admin", "editor"] },
  { id: "2", name: "Grace", age: 44, active: false, roles: ["editor"] },
  { id: "3", name: "Ada", age: 28, active: true, roles: ["viewer"] },
];

const { column: typedColumn } = createColumnFactory<User>();

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true, filterable: true }),
  column("age", { header: "Age", sortable: true }),
  column("active", { header: "Active", filterable: true }),
  column("roles", { header: "Roles", filterable: true }),
  typedColumn("displayName", {
    header: "Display Name",
    accessor: (row) => `${row.name} (${row.id})`,
    sortable: true,
    filterable: true,
  }),
]);

describe("core pipeline", () => {
  it("applies string and array filters", () => {
    const filtered = applyFilters(
      users,
      {
        name: "ad",
        roles: "admin",
      },
      columns,
    );

    expect(filtered).toEqual([users[0]]);
  });

  it("applies sorting with the selected direction", () => {
    const sorted = applySorting(
      users,
      [
        {
          columnId: "age",
          direction: "desc",
        },
      ],
      columns,
    );

    expect(sorted.map((user) => user.id)).toEqual(["2", "1", "3"]);
  });

  it("applies multi-column sorting in descriptor order", () => {
    const sorted = applySorting(
      users,
      [
        {
          columnId: "name",
          direction: "asc",
        },
        {
          columnId: "age",
          direction: "asc",
        },
      ],
      columns,
    );

    expect(sorted.map((user) => user.id)).toEqual(["3", "1", "2"]);
  });

  it("supports filtering and sorting by arbitrary accessor column ids", () => {
    const filtered = applyFilters(
      users,
      {
        displayName: "Grace",
      },
      columns,
    );
    const sorted = applySorting(
      users,
      [
        {
          columnId: "displayName",
          direction: "desc",
        },
      ],
      columns,
    );

    expect(filtered).toEqual([users[1]]);
    expect(sorted.map((user) => user.id)).toEqual(["2", "3", "1"]);
  });

  it("creates headers with sort priority metadata", () => {
    const headers = createHeaders(columns, [
      { columnId: "name", direction: "asc" },
      { columnId: "age", direction: "desc" },
    ]);

    expect(headers.find((header) => header.id === "name")).toMatchObject({
      isSorted: true,
      sortDirection: "asc",
      sortIndex: 1,
    });
    expect(headers.find((header) => header.id === "age")).toMatchObject({
      isSorted: true,
      sortDirection: "desc",
      sortIndex: 2,
    });
    expect(headers.find((header) => header.id === "active")).toMatchObject({
      isSorted: false,
      sortDirection: null,
      sortIndex: null,
    });
  });

  it("applies pagination against the transformed rows", () => {
    const paginated = applyPagination(users, {
      page: 1,
      pageSize: 2,
    });

    expect(paginated).toEqual([users[2]]);
  });

  it("creates rows with selected state and render values", () => {
    const rows = createRows(users.slice(0, 1), {
      columns,
      getRowId: (row) => row.id,
      rowSelection: {
        "1": true,
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.isSelected).toBe(true);
    expect(rows[0]?.cells.map((cell) => cell.columnId)).toEqual([
      "name",
      "age",
      "active",
      "roles",
      "displayName",
    ]);
    expect(rows[0]?.cells[0]?.render()).toBe("Ada");
    expect(rows[0]?.cells[4]?.render()).toBe("Ada (1)");
  });
});
