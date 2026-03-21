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
  column("name", { header: "Name", sortable: true, filterable: true }),
  column("age", { header: "Age", sortable: true }),
]);

const users: User[] = [
  { id: "1", name: "Charlie", age: 25 },
  { id: "2", name: "Alice", age: 31 },
  { id: "3", name: "Bob", age: 29 },
  { id: "4", name: "Alice", age: 24 },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function sortUsers(
  rows: readonly User[],
  sorting: { columnId: string; direction: "asc" | "desc" }[] | null,
): User[] {
  if (!sorting || sorting.length === 0) {
    return [...rows];
  }

  return [...rows].sort((left, right) => {
    for (const descriptor of sorting) {
      const leftValue = left[descriptor.columnId as keyof User];
      const rightValue = right[descriptor.columnId as keyof User];
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

function filterUsers(rows: readonly User[], filters: Record<string, unknown>): User[] {
  const nameFilter = String(filters.name ?? "").toLowerCase();

  if (!nameFilter) {
    return [...rows];
  }

  return rows.filter((row) => row.name.toLowerCase().includes(nameFilter));
}

describe("remote row-selection ergonomics", () => {
  it("can reset advanced remote selection automatically when the query scope changes", async () => {
    const query = vi.fn(
      async ({
        pagination,
        sorting,
        filters,
      }: {
        pagination: { page: number; pageSize: number };
        sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
        filters: Record<string, unknown>;
      }) => {
        const filtered = filterUsers(users, filters);
        const sorted = sortUsers(filtered, sorting);
        const start = pagination.page * pagination.pageSize;

        return {
          rows: sorted.slice(start, start + pagination.pageSize),
          total: sorted.length,
        };
      },
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
          sorting: true,
          filtering: true,
          pagination: true,
          rowSelection: true,
        },
        remoteRowSelection: {
          strategy: "all-except",
          resetOnQueryChange: true,
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    });

    act(() => {
      result.current.remoteRowSelection?.selectAllMatchingRows();
      result.current.toggleRowSelection("1");
    });

    expect(result.current.remoteRowSelection?.state).toEqual({
      mode: "all-except",
      includedIds: [],
      excludedIds: ["1"],
    });
    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(3);

    act(() => {
      result.current.nextPage();
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(result.current.rows.map((row) => row.id)).toEqual(["3", "4"]);
    });

    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(3);
    expect(result.current.rows.every((row) => row.isSelected)).toBe(true);

    act(() => {
      result.current.sortBy("name");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.page).toBe(0);
      expect(result.current.remoteRowSelection?.state).toEqual({
        mode: "include",
        includedIds: [],
        excludedIds: [],
      });
    });

    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(0);
    expect(result.current.selectedRowIds).toEqual([]);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("supports custom remote selection scope keys", async () => {
    const query = vi.fn(
      async ({
        pagination,
        sorting,
        filters,
      }: {
        pagination: { page: number; pageSize: number };
        sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
        filters: Record<string, unknown>;
      }) => {
        const filtered = filterUsers(users, filters);
        const sorted = sortUsers(filtered, sorting);
        const start = pagination.page * pagination.pageSize;

        return {
          rows: sorted.slice(start, start + pagination.pageSize),
          total: sorted.length,
        };
      },
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
          sorting: true,
          filtering: true,
          pagination: true,
          rowSelection: true,
        },
        remoteRowSelection: {
          strategy: "all-except",
          resetOnQueryChange: true,
          getQueryScopeKey: ({ filters }) => JSON.stringify({ name: filters.name ?? null }),
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    });

    act(() => {
      result.current.remoteRowSelection?.selectAllMatchingRows();
    });

    expect(result.current.remoteRowSelection?.allMatchingRowsSelected).toBe(true);
    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(4);

    act(() => {
      result.current.sortBy("name");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["2", "4"]);
    });

    expect(result.current.remoteRowSelection?.allMatchingRowsSelected).toBe(true);
    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(4);

    act(() => {
      result.current.setFilter("name", "ali");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.remoteRowSelection?.state).toEqual({
        mode: "include",
        includedIds: [],
        excludedIds: [],
      });
    });

    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(0);
  });
});