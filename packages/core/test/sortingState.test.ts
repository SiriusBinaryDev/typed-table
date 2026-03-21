import { describe, expect, it } from "vitest";

import {
  clearSorting,
  clearSortingColumn,
  createTableState,
  toggleSorting,
} from "@typed-table/core";

describe("sorting state", () => {
  it("normalizes a legacy single-sort input into a sorting array", () => {
    const state = createTableState({
      sorting: {
        columnId: "name",
        direction: "asc",
      },
    });

    expect(state.sorting).toEqual([
      {
        columnId: "name",
        direction: "asc",
      },
    ]);
  });

  it("cycles single-column sorting from asc to desc to cleared", () => {
    const initial = createTableState();
    const asc = toggleSorting(initial, "name");
    const desc = toggleSorting(asc, "name");
    const cleared = toggleSorting(desc, "name");

    expect(asc.sorting).toEqual([{ columnId: "name", direction: "asc" }]);
    expect(desc.sorting).toEqual([{ columnId: "name", direction: "desc" }]);
    expect(cleared.sorting).toBeNull();
  });

  it("supports additive multi-column sorting when requested", () => {
    const initial = createTableState();
    const byName = toggleSorting(initial, "name", { multi: true });
    const byNameThenAge = toggleSorting(byName, "age", { multi: true });
    const byNameDescThenAge = toggleSorting(byNameThenAge, "name", { multi: true });
    const onlyAge = toggleSorting(byNameDescThenAge, "name", { multi: true });

    expect(byName.sorting).toEqual([{ columnId: "name", direction: "asc" }]);
    expect(byNameThenAge.sorting).toEqual([
      { columnId: "name", direction: "asc" },
      { columnId: "age", direction: "asc" },
    ]);
    expect(byNameDescThenAge.sorting).toEqual([
      { columnId: "name", direction: "desc" },
      { columnId: "age", direction: "asc" },
    ]);
    expect(onlyAge.sorting).toEqual([{ columnId: "age", direction: "asc" }]);
  });

  it("clears a single sorting descriptor without mutating the others", () => {
    const state = createTableState({
      sorting: [
        { columnId: "name", direction: "asc" },
        { columnId: "age", direction: "desc" },
      ],
    });

    expect(clearSortingColumn(state, "name").sorting).toEqual([
      { columnId: "age", direction: "desc" },
    ]);
    expect(clearSortingColumn(state, "age").sorting).toEqual([
      { columnId: "name", direction: "asc" },
    ]);
    expect(clearSortingColumn(state, "missing").sorting).toEqual([
      { columnId: "name", direction: "asc" },
      { columnId: "age", direction: "desc" },
    ]);
  });

  it("clears all sorting descriptors", () => {
    const state = createTableState({
      sorting: [
        { columnId: "name", direction: "asc" },
        { columnId: "age", direction: "desc" },
      ],
    });

    expect(clearSorting(state).sorting).toBeNull();
  });
});
