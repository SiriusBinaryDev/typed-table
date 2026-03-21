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

function createGroupedRows(collapseAda: boolean) {
  return [
    {
      type: "group" as const,
      id: "group:name=Ada",
      groupingColumnId: "name",
      groupingValue: "Ada",
      leafRowCount: 2,
      subRows: collapseAda
        ? []
        : [
            { original: users[0]! },
            { original: users[2]! },
          ],
    },
    {
      type: "group" as const,
      id: "group:name=Grace",
      groupingColumnId: "name",
      groupingValue: "Grace",
      subRows: [{ original: users[1]! }],
    },
  ];
}

describe("remote grouping and faceting", () => {
  it("passes grouping state to the query and exposes remote grouped rows plus faceting metadata", async () => {
    const query = vi.fn(async ({ grouping, rowExpansion }) => ({
      rows: [],
      total: rowExpansion["group:name=Ada"] === false ? 3 : 5,
      groupedRows: grouping.length > 0 ? createGroupedRows(rowExpansion["group:name=Ada"] === false) : undefined,
      faceting: {
        uniqueValues: {
          roles: [
            { value: "admin", count: 1 },
            { value: "editor", count: 2 },
            { value: "viewer", count: 1 },
          ],
        },
        minMaxValues: {
          age: { min: 28, max: 44 },
        },
      },
    }));

    const { result } = renderHook(() =>
      useTable<User>({
        columns,
        mode: "remote",
        query,
        getRowId: (row) => row.id,
        initialState: {
          grouping: ["name"],
        },
        features: {
          grouping: true,
          rowExpansion: true,
          filtering: true,
          pagination: false,
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rows.map((row) => row.id)).toEqual([
        "group:name=Ada",
        "1",
        "3",
        "group:name=Grace",
        "2",
      ]);
    });

    expect(query).toHaveBeenCalledWith(expect.objectContaining({
      grouping: ["name"],
      rowExpansion: {},
    }));
    expect(result.current.rows[0]).toMatchObject({
      type: "group",
      canExpand: true,
      isExpanded: true,
      groupingColumnId: "name",
      groupingValue: "Ada",
      leafRowCount: 2,
    });
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
      result.current.toggleRowExpanded("group:name=Ada");
    });

    await waitFor(() => {
      expect(query).toHaveBeenCalledTimes(2);
      expect(result.current.rows.map((row) => row.id)).toEqual([
        "group:name=Ada",
        "group:name=Grace",
        "2",
      ]);
    });

    expect(query.mock.lastCall?.[0]).toMatchObject({
      grouping: ["name"],
      rowExpansion: {
        "group:name=Ada": false,
      },
    });
  });
});
