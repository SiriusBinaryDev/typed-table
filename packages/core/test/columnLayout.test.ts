import { describe, expect, it } from "vitest";

import {
  clearColumnOrder,
  clearColumnPinning,
  column,
  createColumns,
  createHeaders,
  createRows,
  createTableState,
  getOrderedColumns,
  moveColumn,
  setColumnOrder,
  setColumnPinning,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name" }),
  column("age", { header: "Age" }),
  column("id", { header: "Id" }),
]);

const users: User[] = [
  { id: "1", name: "Ada", age: 36 },
];

describe("column layout state", () => {
  it("creates table state with explicit column order and pinning", () => {
    const state = createTableState({
      columnOrder: ["age", "name"],
      columnPinning: {
        age: "left",
      },
    });

    expect(state.columnOrder).toEqual(["age", "name"]);
    expect(state.columnPinning).toEqual({ age: "left" });
  });

  it("sets, moves, and clears column order", () => {
    const ordered = setColumnOrder(createTableState(), ["id", "name", "id"]);
    const moved = moveColumn(ordered, "name", 0, columns.map((column) => column.id));
    const cleared = clearColumnOrder(moved);

    expect(ordered.columnOrder).toEqual(["id", "name"]);
    expect(moved.columnOrder).toEqual(["name", "id", "age"]);
    expect(cleared.columnOrder).toEqual([]);
  });

  it("pins and clears column pinning sparsely", () => {
    const pinned = setColumnPinning(createTableState(), "age", "right");
    const unpinned = setColumnPinning(pinned, "age", null);
    const cleared = clearColumnPinning(
      createTableState({
        columnPinning: {
          name: "left",
          age: "right",
        },
      }),
    );

    expect(pinned.columnPinning).toEqual({ age: "right" });
    expect(unpinned.columnPinning).toEqual({});
    expect(cleared.columnPinning).toEqual({});
  });

  it("orders columns and partitions pinned regions around the center", () => {
    const orderedColumns = getOrderedColumns(
      columns,
      ["id", "name", "age"],
      {
        age: "left",
        id: "right",
      },
    );

    expect(orderedColumns.map((column) => column.id)).toEqual(["age", "name", "id"]);
  });

  it("adds pin metadata to headers and cells", () => {
    const orderedColumns = getOrderedColumns(
      columns,
      ["id", "name", "age"],
      {
        age: "left",
        id: "right",
      },
    );
    const headers = createHeaders(orderedColumns, null, {
      age: "left",
      id: "right",
    });
    const rows = createRows(users, {
      columns: orderedColumns,
      columnPinning: {
        age: "left",
        id: "right",
      },
      getRowId: (row) => row.id,
    });

    expect(headers.map((header) => [header.id, header.pin])).toEqual([
      ["age", "left"],
      ["name", null],
      ["id", "right"],
    ]);
    expect(rows[0]?.cells.map((cell) => [cell.columnId, cell.pin])).toEqual([
      ["age", "left"],
      ["name", null],
      ["id", "right"],
    ]);
  });
});
