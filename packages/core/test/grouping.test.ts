import { describe, expect, it } from "vitest";

import {
  clearGrouping,
  clearRowExpansion,
  column,
  createColumns,
  createGroupedRows,
  createTableState,
  setGrouping,
  setRowExpanded,
  toggleGrouping,
  toggleRowExpanded,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
  active: boolean;
};

const columns = createColumns<User>([
  column("name", { header: "Name" }),
  column("age", { header: "Age" }),
  column("active", { header: "Active" }),
]);

const users: User[] = [
  { id: "1", name: "Ada", age: 36, active: true },
  { id: "2", name: "Grace", age: 44, active: false },
  { id: "3", name: "Ada", age: 28, active: false },
];

describe("grouping state and row model", () => {
  it("creates table state with grouping and expansion defaults", () => {
    const state = createTableState({
      grouping: ["name", "name", "age"],
      rowExpansion: {
        "group:name=Ada": false,
      },
    });

    expect(state.grouping).toEqual(["name", "age"]);
    expect(state.rowExpansion).toEqual({
      "group:name=Ada": false,
    });
  });

  it("sets, toggles, and clears grouping while resetting expansion", () => {
    const grouped = setGrouping(
      createTableState({
        rowExpansion: {
          "group:name=Ada": false,
        },
      }),
      ["name", "name", "age"],
    );
    const toggledOff = toggleGrouping(grouped, "name");
    const toggledOn = toggleGrouping(toggledOff, "name");
    const cleared = clearGrouping(toggledOn);

    expect(grouped.grouping).toEqual(["name", "age"]);
    expect(grouped.rowExpansion).toEqual({});
    expect(toggledOff.grouping).toEqual(["age"]);
    expect(toggledOn.grouping).toEqual(["age", "name"]);
    expect(cleared.grouping).toEqual([]);
  });

  it("stores collapsed rows sparsely and clears expansion state", () => {
    const collapsed = setRowExpanded(createTableState(), "group:name=Ada", false);
    const expanded = toggleRowExpanded(collapsed, "group:name=Ada");
    const reCollapsed = toggleRowExpanded(expanded, "group:name=Ada");
    const cleared = clearRowExpansion(reCollapsed);

    expect(collapsed.rowExpansion).toEqual({
      "group:name=Ada": false,
    });
    expect(expanded.rowExpansion).toEqual({});
    expect(reCollapsed.rowExpansion).toEqual({
      "group:name=Ada": false,
    });
    expect(cleared.rowExpansion).toEqual({});
  });

  it("builds grouped rows and flattens only expanded groups", () => {
    const grouped = createGroupedRows(users, {
      allColumns: columns,
      visibleColumns: columns,
      grouping: ["name"],
      getRowId: (row) => row.id,
    });

    expect(grouped.rootRows.map((row) => row.id)).toEqual([
      "group:name=Ada",
      "group:name=Grace",
    ]);
    expect(grouped.rows.map((row) => row.id)).toEqual([
      "group:name=Ada",
      "1",
      "3",
      "group:name=Grace",
      "2",
    ]);
    expect(grouped.rows[0]).toMatchObject({
      type: "group",
      depth: 0,
      canExpand: true,
      isExpanded: true,
      groupingColumnId: "name",
      groupingValue: "Ada",
      leafRowCount: 2,
    });
    expect(grouped.rows[1]).toMatchObject({
      type: "data",
      parentId: "group:name=Ada",
      depth: 1,
    });
    expect(grouped.rows[0]?.cells.map((cell) => cell.value)).toEqual(["Ada", null, null]);

    const collapsed = createGroupedRows(users, {
      allColumns: columns,
      visibleColumns: columns,
      grouping: ["name"],
      rowExpansion: {
        "group:name=Ada": false,
      },
      getRowId: (row) => row.id,
    });

    expect(collapsed.rows.map((row) => row.id)).toEqual([
      "group:name=Ada",
      "group:name=Grace",
      "2",
    ]);
  });
});
