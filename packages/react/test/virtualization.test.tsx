// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  column,
  createColumns,
  getVirtualTableLayout,
  partitionHeadersByPin,
  partitionRowCellsByPin,
  useTable,
} from "@typed-table/react";

type User = {
  id: string;
  name: string;
  age: number;
  city: string;
};

const columns = createColumns<User>([
  column("name", { header: "Name", size: 220 }),
  column("age", { header: "Age", size: 96 }),
  column("city", { header: "City", size: 180 }),
]);

const users: User[] = [
  { id: "1", name: "Ada", age: 36, city: "Madrid" },
  { id: "2", name: "Grace", age: 44, city: "Berlin" },
];

afterEach(() => {
  cleanup();
});

describe("virtualization helpers", () => {
  it("partitions headers and row cells by pin state and derives widths", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        features: {
          columnPinning: true,
          columnResizing: true,
        },
        initialState: {
          columnPinning: {
            name: "left",
            city: "right",
          },
          columnSizing: {
            age: 120,
          },
        },
      }),
    );

    const layout = getVirtualTableLayout(result.current);
    const rowCells = partitionRowCellsByPin(result.current.rows[0]!);

    expect(layout.left.map((header) => header.id)).toEqual(["name"]);
    expect(layout.center.map((header) => header.id)).toEqual(["age"]);
    expect(layout.right.map((header) => header.id)).toEqual(["city"]);
    expect(layout.leftWidth).toBe(220);
    expect(layout.centerWidth).toBe(120);
    expect(layout.rightWidth).toBe(180);
    expect(layout.totalWidth).toBe(520);
    expect(rowCells.left.map((cell) => cell.columnId)).toEqual(["name"]);
    expect(rowCells.center.map((cell) => cell.columnId)).toEqual(["age"]);
    expect(rowCells.right.map((cell) => cell.columnId)).toEqual(["city"]);
  });

  it("keeps unpinned headers and cells in the center partition", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
      }),
    );

    const layout = getVirtualTableLayout(result.current);
    const headerPartitions = partitionHeadersByPin(result.current.headers);
    const cellPartitions = partitionRowCellsByPin(result.current.rows[0]!);

    expect(layout.left).toEqual([]);
    expect(layout.right).toEqual([]);
    expect(layout.center.map((header) => header.id)).toEqual(["name", "age", "city"]);
    expect(layout.totalWidth).toBe(
      result.current.headers.reduce((sum, header) => sum + header.size, 0),
    );
    expect(headerPartitions.center.map((header) => header.id)).toEqual(["name", "age", "city"]);
    expect(cellPartitions.center.map((cell) => cell.columnId)).toEqual(["name", "age", "city"]);
  });
});
