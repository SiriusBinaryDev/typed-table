// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  column,
  createColumnFactory,
  createColumns,
  useTable,
} from "@typed-table/react";

type User = {
  id: string;
  name: string;
  age: number;
};

const { column: typedColumn } = createColumnFactory<User>();

const columns = createColumns<User>([
  column("name", { header: "Name", sortable: true, filterable: true }),
  column("age", { header: "Age", sortable: true }),
  typedColumn("displayName", {
    header: "Display Name",
    accessor: (row) => `${row.name} (${row.id})`,
    sortable: true,
    filterable: true,
  }),
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
      const leftValue =
        descriptor.columnId === "displayName"
          ? `${left.name} (${left.id})`
          : left[descriptor.columnId as keyof User];
      const rightValue =
        descriptor.columnId === "displayName"
          ? `${right.name} (${right.id})`
          : right[descriptor.columnId as keyof User];

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

describe("useTable", () => {
  it("manages local sorting, filtering, pagination, row selection, and column visibility", () => {
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
          sorting: true,
          filtering: true,
          pagination: true,
          rowSelection: true,
          columnVisibility: true,
        },
      }),
    );

    expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    expect(result.current.pageCount).toBe(2);
    expect(result.current.remoteRowSelection).toBeNull();

    act(() => {
      result.current.sortBy("name");
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["2", "4"]);

    act(() => {
      result.current.setFilter("name", "bo");
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["3"]);
    expect(result.current.page).toBe(0);

    act(() => {
      result.current.toggleRowSelection("3");
    });

    expect(result.current.selectedRowIds).toEqual(["3"]);

    act(() => {
      result.current.setColumnVisibility("age", false);
    });

    expect(result.current.columnVisibility).toEqual({ age: false });
    expect(result.current.headers.map((header) => header.id)).toEqual([
      "name",
      "displayName",
    ]);
    expect(result.current.rows[0]?.cells.map((cell) => cell.columnId)).toEqual([
      "name",
      "displayName",
    ]);

    act(() => {
      result.current.toggleColumnVisibility("age");
      result.current.clearFilters();
    });

    expect(result.current.columnVisibility).toEqual({});
    expect(result.current.page).toBe(0);
    expect(result.current.rows.map((row) => row.id)).toEqual(["2", "4"]);
  });

  it("manages column ordering and pinning locally", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        features: {
          columnOrdering: true,
          columnPinning: true,
        },
      }),
    );

    act(() => {
      result.current.moveColumn("displayName", 0);
      result.current.setColumnPinning("age", "right");
    });

    expect(result.current.columnOrder).toEqual(["displayName", "name", "age"]);
    expect(result.current.columnPinning).toEqual({ age: "right" });
    expect(result.current.headers.map((header) => [header.id, header.pin])).toEqual([
      ["displayName", null],
      ["name", null],
      ["age", "right"],
    ]);
    expect(result.current.rows[0]?.cells.map((cell) => [cell.columnId, cell.pin])).toEqual([
      ["displayName", null],
      ["name", null],
      ["age", "right"],
    ]);

    act(() => {
      result.current.setColumnPinning("displayName", "left");
      result.current.clearColumnOrder();
    });

    expect(result.current.headers.map((header) => [header.id, header.pin])).toEqual([
      ["displayName", "left"],
      ["name", null],
      ["age", "right"],
    ]);

    act(() => {
      result.current.clearColumnPinning();
    });

    expect(result.current.columnPinning).toEqual({});
    expect(result.current.headers.map((header) => [header.id, header.pin])).toEqual([
      ["name", null],
      ["age", null],
      ["displayName", null],
    ]);
  });

  it("can clear a single sorting descriptor", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        features: {
          sorting: true,
        },
      }),
    );

    act(() => {
      result.current.sortBy("name");
      result.current.sortBy("age", { multi: true });
    });

    expect(result.current.sorting).toEqual([
      { columnId: "name", direction: "asc" },
      { columnId: "age", direction: "asc" },
    ]);

    act(() => {
      result.current.clearSortingColumn("name");
    });

    expect(result.current.sorting).toEqual([
      { columnId: "age", direction: "asc" },
    ]);
    expect(result.current.headers.find((header) => header.id === "name")).toMatchObject({
      isSorted: false,
      sortDirection: null,
      sortIndex: null,
    });
    expect(result.current.headers.find((header) => header.id === "age")).toMatchObject({
      isSorted: true,
      sortDirection: "asc",
      sortIndex: 1,
    });
  });

  it("supports additive multi-column sorting", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        features: {
          sorting: true,
        },
      }),
    );

    act(() => {
      result.current.sortBy("name");
      result.current.sortBy("age", { multi: true });
    });

    expect(result.current.sorting).toEqual([
      { columnId: "name", direction: "asc" },
      { columnId: "age", direction: "asc" },
    ]);
    expect(result.current.rows.map((row) => row.id)).toEqual(["4", "2", "3", "1"]);
    expect(result.current.headers.find((header) => header.id === "name")).toMatchObject({
      isSorted: true,
      sortDirection: "asc",
      sortIndex: 1,
    });
    expect(result.current.headers.find((header) => header.id === "age")).toMatchObject({
      isSorted: true,
      sortDirection: "asc",
      sortIndex: 2,
    });
  });

  it("supports sorting and filtering by arbitrary accessor column ids", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        features: {
          sorting: true,
          filtering: true,
        },
      }),
    );

    act(() => {
      result.current.sortBy("displayName");
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["2", "4", "3", "1"]);

    act(() => {
      result.current.setFilter("displayName", "Bob");
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["3"]);
    expect(result.current.headers.find((header) => header.id === "displayName")).toMatchObject({
      isSorted: true,
      sortIndex: 1,
    });
  });


  it("supports controlled and uncontrolled state slices together locally", () => {
    const onStateChange = vi.fn();

    const { result } = renderHook(() => {
      const [sorting, setSorting] = useState<
        { columnId: string; direction: "asc" | "desc" }[] | null
      >(null);

      return useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        state: {
          sorting,
          pagination: {
            page: 0,
            pageSize: 2,
          },
        },
        onStateChange: (nextState) => {
          onStateChange(nextState);
          setSorting(nextState.sorting);
        },
        features: {
          sorting: true,
          filtering: true,
          pagination: true,
        },
      });
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);

    act(() => {
      result.current.sortBy("name");
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["2", "4"]);
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pagination: {
          page: 0,
          pageSize: 2,
        },
        sorting: [{ columnId: "name", direction: "asc" }],
      }),
    );

    act(() => {
      result.current.setFilter("name", "bo");
    });

    expect(result.current.rows.map((row) => row.id)).toEqual(["3"]);
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: {
          name: "bo",
        },
        sorting: [{ columnId: "name", direction: "asc" }],
      }),
    );
  });  it("resolves remote data and exposes loading state transitions", async () => {
    const query = vi.fn(
      async ({
        pagination,
        sorting,
      }: {
        pagination: { page: number; pageSize: number };
        sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
      }) => {
        const sorted = sortUsers(users, sorting);
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
          pagination: true,
          columnVisibility: true,
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    });

    expect(query).toHaveBeenCalledTimes(1);
    expect(result.current.remoteRowSelection).toBeNull();

    act(() => {
      result.current.sortBy("name");
      result.current.sortBy("age", { multi: true });
    });

    await waitFor(() => {
      expect(result.current.rows.map((row) => row.id)).toEqual(["4", "2"]);
    });

    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sorting: [
          { columnId: "name", direction: "asc" },
          { columnId: "age", direction: "asc" },
        ],
      }),
    );

    act(() => {
      result.current.nextPage();
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(result.current.rows.map((row) => row.id)).toEqual(["3", "1"]);
    });
  });


  it("supports controlled state in remote mode", async () => {
    const query = vi.fn(
      async ({
        pagination,
        sorting,
      }: {
        pagination: { page: number; pageSize: number };
        sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
      }) => {
        const sorted = sortUsers(users, sorting);
        const start = pagination.page * pagination.pageSize;

        return {
          rows: sorted.slice(start, start + pagination.pageSize),
          total: sorted.length,
        };
      },
    );
    const onStateChange = vi.fn();

    const { result } = renderHook(() => {
      const [controlledState, setControlledState] = useState<{
        pagination: { page: number; pageSize: number };
        sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
      }>({
        pagination: {
          page: 0,
          pageSize: 2,
        },
        sorting: null,
      });

      return useTable<User>({
        columns,
        mode: "remote",
        query,
        getRowId: (row) => row.id,
        state: controlledState,
        onStateChange: (nextState) => {
          onStateChange(nextState);
          setControlledState((current) => ({
            ...current,
            pagination: nextState.pagination,
            sorting: nextState.sorting,
          }));
        },
        features: {
          sorting: true,
          pagination: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    });

    act(() => {
      result.current.sortBy("name");
    });

    await waitFor(() => {
      expect(result.current.rows.map((row) => row.id)).toEqual(["2", "4"]);
    });

    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pagination: {
          page: 0,
          pageSize: 2,
        },
        sorting: [{ columnId: "name", direction: "asc" }],
      }),
    );

    act(() => {
      result.current.nextPage();
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(result.current.rows.map((row) => row.id)).toEqual(["3", "1"]);
    });

    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pagination: {
          page: 1,
          pageSize: 2,
        },
        sorting: [{ columnId: "name", direction: "asc" }],
      }),
    );
  });  it("supports append-oriented remote loading for sequential pages and resets on scope changes", async () => {
    const query = vi.fn(
      async ({
        pagination,
        sorting,
      }: {
        pagination: { page: number; pageSize: number };
        sorting: { columnId: string; direction: "asc" | "desc" }[] | null;
      }) => {
        const sorted = sortUsers(users, sorting);
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
          pagination: true,
        },
        remoteLoading: {
          mode: "append",
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    });

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.page).toBe(1);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2", "3", "4"]);
    });

    expect(query).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.sortBy("name");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.page).toBe(0);
      expect(result.current.rows.map((row) => row.id)).toEqual(["2", "4"]);
    });

    expect(query).toHaveBeenCalledTimes(3);
  });

  it("supports optional dataset-level remote row selection without refetching on selection changes", async () => {
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
          rowSelection: true,
        },
        remoteRowSelection: {
          strategy: "all-except",
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual(["1", "2"]);
    });

    expect(query).toHaveBeenCalledTimes(1);
    expect(result.current.remoteRowSelection).not.toBeNull();
    expect(result.current.remoteRowSelection?.state).toEqual({
      mode: "include",
      includedIds: [],
      excludedIds: [],
    });

    act(() => {
      result.current.remoteRowSelection?.selectAllMatchingRows();
    });

    expect(result.current.remoteRowSelection?.allMatchingRowsSelected).toBe(true);
    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(4);
    expect(result.current.selectedRowIds).toEqual(["1", "2"]);
    expect(result.current.rows.every((row) => row.isSelected)).toBe(true);
    expect(query).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggleRowSelection("1");
    });

    expect(result.current.remoteRowSelection?.state).toEqual({
      mode: "all-except",
      includedIds: [],
      excludedIds: ["1"],
    });
    expect(result.current.remoteRowSelection?.allMatchingRowsSelected).toBe(false);
    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(3);
    expect(result.current.selectedRowIds).toEqual(["2"]);
    expect(query).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.nextPage();
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(result.current.rows.map((row) => row.id)).toEqual(["3", "4"]);
    });

    expect(result.current.rows.every((row) => row.isSelected)).toBe(true);
    expect(query).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.clearRowSelection();
    });

    expect(result.current.remoteRowSelection?.state).toEqual({
      mode: "include",
      includedIds: [],
      excludedIds: [],
    });
    expect(result.current.remoteRowSelection?.selectedRowCount).toBe(0);
    expect(result.current.selectedRowIds).toEqual([]);
    expect(query).toHaveBeenCalledTimes(2);
  });


  it("supports local grouping and row expansion", () => {
    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        data: users,
        getRowId: (row) => row.id,
        initialState: {
          grouping: ["name"],
          sorting: {
            columnId: "name",
            direction: "asc",
          },
          pagination: {
            page: 0,
            pageSize: 10,
          },
        },
        features: {
          sorting: true,
          pagination: true,
          grouping: true,
          rowExpansion: true,
          rowSelection: true,
        },
      }),
    );

    expect(result.current.grouping).toEqual(["name"]);
    expect(result.current.rows.map((row) => row.id)).toEqual([
      "group:name=Alice",
      "2",
      "4",
      "group:name=Bob",
      "3",
      "group:name=Charlie",
      "1",
    ]);
    expect(result.current.rows[0]).toMatchObject({
      type: "group",
      canExpand: true,
      isExpanded: true,
      groupingColumnId: "name",
      groupingValue: "Alice",
      leafRowCount: 2,
    });
    expect(result.current.rows[1]).toMatchObject({
      type: "data",
      depth: 1,
      parentId: "group:name=Alice",
    });

    act(() => {
      result.current.toggleRowSelection("group:name=Alice");
      result.current.toggleRowExpanded("group:name=Alice");
    });

    expect(result.current.selectedRowIds).toEqual([]);
    expect(result.current.rowExpansion).toEqual({
      "group:name=Alice": false,
    });
    expect(result.current.rows.map((row) => row.id)).toEqual([
      "group:name=Alice",
      "group:name=Bob",
      "3",
      "group:name=Charlie",
      "1",
    ]);

    act(() => {
      result.current.setRowExpanded("group:name=Alice", true);
      result.current.toggleGrouping("age");
    });

    expect(result.current.rowExpansion).toEqual({});
    expect(result.current.grouping).toEqual(["name", "age"]);
    expect(result.current.pageCount).toBe(2);
    expect(result.current.rows.map((row) => row.id)).toEqual([
      "group:name=Alice",
      "group:name=Alice|age=31",
      "2",
      "group:name=Alice|age=24",
      "4",
      "group:name=Bob",
      "group:name=Bob|age=29",
      "3",
      "group:name=Charlie",
      "group:name=Charlie|age=25",
    ]);
  });

  it("updates remote headers and cells for visibility, ordering, and pinning without refetching", async () => {
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
          columnVisibility: true,
          columnOrdering: true,
          columnPinning: true,
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows[0]?.cells.map((cell) => cell.columnId)).toEqual([
        "name",
        "age",
        "displayName",
      ]);
    });

    expect(query).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setColumnVisibility("age", false);
      result.current.moveColumn("displayName", 0);
      result.current.setColumnPinning("name", "left");
    });

    expect(result.current.headers.map((header) => [header.id, header.pin])).toEqual([
      ["name", "left"],
      ["displayName", null],
    ]);
    expect(result.current.rows[0]?.cells.map((cell) => [cell.columnId, cell.pin])).toEqual([
      ["name", "left"],
      ["displayName", null],
    ]);
    expect(query).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggleColumnVisibility("age");
      result.current.setColumnPinning("age", "right");
    });

    expect(result.current.rows[0]?.cells.map((cell) => [cell.columnId, cell.pin])).toEqual([
      ["name", "left"],
      ["displayName", null],
      ["age", "right"],
    ]);
    expect(query).toHaveBeenCalledTimes(1);
  });
});








