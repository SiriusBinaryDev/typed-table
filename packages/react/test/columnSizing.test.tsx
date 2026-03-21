// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { column, createColumns, useTable } from "@typed-table/react";

type User = {
  id: string;
  name: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name", size: 220, minSize: 160, sortable: true }),
  column("age", { header: "Age", size: 96, minSize: 72, maxSize: 132, sortable: true }),
  column("id", { header: "Id", size: 120, resizable: false }),
]);

const users: User[] = [
  { id: "1", name: "Ada", age: 36 },
  { id: "2", name: "Grace", age: 44 },
  { id: "3", name: "Lin", age: 29 },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useTable column sizing", () => {
  it("manages local sizing state and exposes sizing metadata on headers and cells", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        features: {
          columnResizing: true,
        },
      }),
    );

    expect(result.current.headers.map((header) => [header.id, header.size, header.canResize])).toEqual([
      ["name", 220, true],
      ["age", 96, true],
      ["id", 120, false],
    ]);

    act(() => {
      result.current.setColumnSize("name", 300);
      result.current.resizeColumn("age", -200);
    });

    expect(result.current.columnSizing).toEqual({
      name: 300,
      age: 72,
    });
    expect(result.current.headers.map((header) => [header.id, header.size])).toEqual([
      ["name", 300],
      ["age", 72],
      ["id", 120],
    ]);
    expect(result.current.rows[0]?.cells.map((cell) => [cell.columnId, cell.size, cell.canResize])).toEqual([
      ["name", 300, true],
      ["age", 72, true],
      ["id", 120, false],
    ]);

    act(() => {
      result.current.clearColumnSizing();
    });

    expect(result.current.columnSizing).toEqual({});
    expect(result.current.headers.map((header) => [header.id, header.size])).toEqual([
      ["name", 220],
      ["age", 96],
      ["id", 120],
    ]);
  });

  it("updates remote sizing metadata without refetching", async () => {
    const query = vi.fn(
      async ({
        pagination,
      }: {
        pagination: { page: number; pageSize: number };
      }) => ({
        rows: users.slice(
          pagination.page * pagination.pageSize,
          pagination.page * pagination.pageSize + pagination.pageSize,
        ),
        total: users.length,
      }),
    );

    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        mode: "remote",
        query,
        getRowId: (row) => row.id,
        initialState: {
          pagination: {
            page: 0,
            pageSize: 2,
          },
        },
        features: {
          pagination: true,
          columnResizing: true,
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    });

    expect(query).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setColumnSize("name", 280);
      result.current.resizeColumn("age", 20);
    });

    expect(result.current.headers.map((header) => [header.id, header.size])).toEqual([
      ["name", 280],
      ["age", 116],
      ["id", 120],
    ]);
    expect(result.current.rows[0]?.cells.map((cell) => [cell.columnId, cell.size])).toEqual([
      ["name", 280],
      ["age", 116],
      ["id", 120],
    ]);
    expect(query).toHaveBeenCalledTimes(1);
  });
});