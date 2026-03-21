// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { column, createColumns, useTable } from "@typed-table/react";

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
  { id: "3", name: "Lin", age: 29 },
  { id: "4", name: "Margaret", age: 39 },
];

afterEach(() => {
  cleanup();
});

describe("useTable row ordering", () => {
  it("manages local row order as the base dataset order", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        initialState: {
          pagination: {
            page: 0,
            pageSize: 2,
          },
        },
        features: {
          pagination: true,
          rowOrdering: true,
        },
      }),
    );

    expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);

    act(() => {
      result.current.moveRow("3", 0);
    });

    expect(result.current.rowOrder).toEqual(["3", "1", "2", "4"]);
    expect(result.current.rows.map((row) => row.id)).toEqual(["3", "1"]);

    act(() => {
      result.current.setRowOrder(["4", "2", "4"]);
    });

    expect(result.current.rowOrder).toEqual(["4", "2"]);
    expect(result.current.rows.map((row) => row.id)).toEqual(["4", "2"]);

    act(() => {
      result.current.clearRowOrder();
    });

    expect(result.current.rowOrder).toEqual([]);
    expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
  });

  it("requires an explicit getRowId before row ordering is enabled", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        features: {
          rowOrdering: true,
        },
      }),
    );

    act(() => {
      result.current.moveRow("2", 0);
      result.current.setRowOrder(["2", "1"]);
    });

    expect(result.current.rowOrder).toEqual([]);
    expect(result.current.rows.map((row) => row.original?.id)).toEqual(["1", "2", "3", "4"]);
  });
});
