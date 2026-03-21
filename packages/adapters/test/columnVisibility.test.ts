import { describe, expect, it, vi } from "vitest";

import { createLocalAdapter, createRemoteAdapter } from "@typed-table/adapters";
import { column, createColumns, createTableState } from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true }),
  column("age", { header: "Age", sortable: true }),
]);

const users: User[] = [
  { id: "1", name: "Ada", age: 36 },
  { id: "2", name: "Grace", age: 44 },
  { id: "3", name: "Bob", age: 29 },
];

describe("column visibility adapters", () => {
  it("hides local headers and cells while retaining sorting behavior", () => {
    const model = createLocalAdapter({
      columns,
      data: users,
      state: createTableState({
        sorting: { columnId: "age", direction: "asc" },
        columnVisibility: {
          age: false,
        },
      }),
      getRowId: (row) => row.id,
      features: {
        sorting: true,
        columnVisibility: true,
      },
    });

    expect(model.headers.map((header) => header.id)).toEqual(["name"]);
    expect(model.rows[0]?.id).toBe("3");
    expect(model.rows[0]?.cells.map((cell) => cell.columnId)).toEqual(["name"]);
  });

  it("hides remote headers and cells while passing hidden-column sorting to the query", async () => {
    const query = vi.fn(async ({ sorting }: { sorting: unknown }) => {
      expect(sorting).toEqual([{ columnId: "age", direction: "desc" }]);

      return {
        rows: users,
        total: users.length,
      };
    });

    const model = await createRemoteAdapter({
      columns,
      state: createTableState({
        sorting: { columnId: "age", direction: "desc" },
        columnVisibility: {
          age: false,
        },
      }),
      query,
      getRowId: (row) => row.id,
      features: {
        sorting: true,
        columnVisibility: true,
      },
    });

    expect(query).toHaveBeenCalledTimes(1);
    expect(model.headers.map((header) => header.id)).toEqual(["name"]);
    expect(model.rows[0]?.cells.map((cell) => cell.columnId)).toEqual(["name"]);
  });
});
