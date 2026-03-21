// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  column,
  createColumns,
  useTable,
} from "@typed-table/react";

type User = {
  id: string;
  name: string;
  age: number;
  roles: string[];
};

const columns = createColumns<User>([
  column("name", { header: "Name", filterable: true }),
  column("age", { header: "Age", filterable: true }),
  column("roles", { header: "Roles", filterable: true }),
]);

const users: User[] = [
  { id: "1", name: "Ada", age: 36, roles: ["admin", "editor"] },
  { id: "2", name: "Grace", age: 44, roles: ["editor"] },
  { id: "3", name: "Ada", age: 28, roles: ["viewer"] },
];

describe("useTable faceting", () => {
  it("exposes local faceted unique values and numeric min/max metadata", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        features: {
          filtering: true,
        },
      }),
    );

    expect(result.current.getFacetedUniqueValues("roles")).toEqual([
      { value: "admin", count: 1 },
      { value: "editor", count: 2 },
      { value: "viewer", count: 1 },
    ]);
    expect(result.current.getFacetedMinMaxValues("age")).toEqual({
      min: 28,
      max: 44,
    });

    act(() => {
      result.current.setFilter("name", "ad");
      result.current.setFilter("age", 36);
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["1"]);
    expect(result.current.getFacetedUniqueValues("roles")).toEqual([
      { value: "admin", count: 1 },
      { value: "editor", count: 1 },
    ]);
    expect(result.current.getFacetedMinMaxValues("age")).toEqual({
      min: 28,
      max: 36,
    });
  });

  it("returns empty or null local faceting metadata in remote mode", async () => {
    const query = vi.fn(async () => ({
      rows: users,
      total: users.length,
    }));

    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        mode: "remote",
        query,
        getRowId: (row) => row.id,
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getFacetedUniqueValues("roles")).toEqual([]);
    expect(result.current.getFacetedMinMaxValues("age")).toBeNull();
  });
});


