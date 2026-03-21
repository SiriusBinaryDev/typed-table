import { describe, expect, it } from "vitest";

import {
  clearColumnSizing,
  column,
  createColumns,
  createGroupedRows,
  createHeaders,
  createRows,
  createTableState,
  resizeColumn,
  setColumnSize,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name", size: 220, minSize: 160 }),
  column("age", { header: "Age", size: 96, minSize: 72, maxSize: 132 }),
  column("id", { header: "Id", size: 120, resizable: false }),
]);

const users: User[] = [
  { id: "1", name: "Ada", age: 36 },
  { id: "2", name: "Ada", age: 28 },
];

describe("column sizing", () => {
  it("stores sparse overrides and clamps sizes to column constraints", () => {
    const sized = setColumnSize(createTableState(), "age", 400, columns);
    const resized = resizeColumn(sized, "age", -1000, columns);
    const reset = setColumnSize(resized, "age", 96, columns);
    const cleared = clearColumnSizing(
      createTableState({
        columnSizing: {
          name: 300,
        },
      }),
    );

    expect(sized.columnSizing).toEqual({ age: 132 });
    expect(resized.columnSizing).toEqual({ age: 72 });
    expect(reset.columnSizing).toEqual({});
    expect(cleared.columnSizing).toEqual({});
  });

  it("adds sizing metadata to headers, flat rows, and grouped rows", () => {
    const state = createTableState({
      columnSizing: {
        name: 280,
        age: 120,
      },
    });
    const headers = createHeaders(columns, null, null, state.columnSizing);
    const rows = createRows(users, {
      columns,
      columnSizing: state.columnSizing,
      getRowId: (row) => row.id,
    });
    const grouped = createGroupedRows(users, {
      allColumns: columns,
      visibleColumns: columns,
      grouping: ["name"],
      columnSizing: state.columnSizing,
      getRowId: (row) => row.id,
    });

    expect(headers.map((header) => [header.id, header.size, header.minSize, header.maxSize, header.canResize])).toEqual([
      ["name", 280, 160, null, true],
      ["age", 120, 72, 132, true],
      ["id", 120, 48, null, false],
    ]);
    expect(rows[0]?.cells.map((cell) => [cell.columnId, cell.size, cell.minSize, cell.maxSize, cell.canResize])).toEqual([
      ["name", 280, 160, null, true],
      ["age", 120, 72, 132, true],
      ["id", 120, 48, null, false],
    ]);
    expect(grouped.rows[0]?.type).toBe("group");
    expect(grouped.rows[0]?.cells.find((cell) => cell.columnId === "name")).toMatchObject({
      size: 280,
      canResize: true,
    });
    expect(grouped.rows[0]?.cells.find((cell) => cell.columnId === "id")).toMatchObject({
      size: 120,
      canResize: false,
    });
  });
});