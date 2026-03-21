import { describe, expect, it } from "vitest";

import {
  clearColumnVisibility,
  column,
  createColumns,
  createTableState,
  getVisibleColumns,
  setColumnVisibility,
  toggleColumnVisibility,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name" }),
  column("age", { header: "Age" }),
]);

describe("column visibility state", () => {
  it("creates table state with explicit column visibility", () => {
    const state = createTableState({
      columnVisibility: {
        age: false,
      },
    });

    expect(state.columnVisibility).toEqual({ age: false });
  });

  it("stores hidden columns sparsely and restores visibility by clearing the entry", () => {
    const hidden = setColumnVisibility(createTableState(), "age", false);
    const shown = setColumnVisibility(hidden, "age", true);

    expect(hidden.columnVisibility).toEqual({ age: false });
    expect(shown.columnVisibility).toEqual({});
  });

  it("toggles and clears column visibility state", () => {
    const hidden = toggleColumnVisibility(createTableState(), "name");
    const shown = toggleColumnVisibility(hidden, "name");
    const cleared = clearColumnVisibility(
      createTableState({
        columnVisibility: {
          name: false,
          age: false,
        },
      }),
    );

    expect(hidden.columnVisibility).toEqual({ name: false });
    expect(shown.columnVisibility).toEqual({});
    expect(cleared.columnVisibility).toEqual({});
  });

  it("filters the column list while leaving unspecified columns visible", () => {
    const visibleColumns = getVisibleColumns(columns, {
      age: false,
    });

    expect(visibleColumns.map((column) => column.id)).toEqual(["name"]);
  });
});
