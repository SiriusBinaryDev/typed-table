import { describe, expect, it } from "vitest";

import {
  column,
  createColumnFactory,
  createColumns,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
  roles: string[];
  scores: number[];
};

const users: User[] = [
  { id: "1", name: "Ada", age: 36, roles: ["admin", "editor"], scores: [10, 30] },
  { id: "2", name: "Grace", age: 44, roles: ["editor"], scores: [40] },
  { id: "3", name: "Ada", age: 28, roles: ["viewer"], scores: [12, 18] },
];

const { column: typedColumn } = createColumnFactory<User>();

const columns = createColumns<User>([
  column("name", { header: "Name", filterable: true }),
  column("age", { header: "Age", filterable: true }),
  column("roles", { header: "Roles", filterable: true }),
  column("scores", { header: "Scores", filterable: true }),
  typedColumn("displayName", {
    header: "Display Name",
    accessor: (row) => `${row.name} (${row.id})`,
    filterable: true,
  }),
  typedColumn("ageBand", {
    header: "Age Band",
    accessor: (row) => Math.floor(row.age / 10),
    filterable: true,
  }),
]);

describe("faceted filtering helpers", () => {
  it("derives unique values from other active filters while ignoring the current column filter", () => {
    expect(
      getFacetedUniqueValues(users, "roles", columns, {
        name: "ad",
        roles: "admin",
      }),
    ).toEqual([
      { value: "admin", count: 1 },
      { value: "editor", count: 1 },
      { value: "viewer", count: 1 },
    ]);
  });

  it("supports accessor columns with arbitrary string ids", () => {
    expect(
      getFacetedUniqueValues(users, "displayName", columns, {
        roles: "editor",
      }),
    ).toEqual([
      { value: "Ada (1)", count: 1 },
      { value: "Grace (2)", count: 1 },
    ]);
  });

  it("derives numeric min/max values from sibling filters while ignoring the current column filter", () => {
    expect(
      getFacetedMinMaxValues(users, "age", columns, {
        name: "ad",
        age: 36,
      }),
    ).toEqual({
      min: 28,
      max: 36,
    });
  });

  it("supports numeric accessor columns and flattens numeric array values for min/max faceting", () => {
    expect(
      getFacetedMinMaxValues(users, "ageBand", columns, {
        roles: "editor",
      }),
    ).toEqual({
      min: 3,
      max: 4,
    });

    expect(
      getFacetedMinMaxValues(users, "scores", columns, {
        name: "ad",
      }),
    ).toEqual({
      min: 10,
      max: 30,
    });
  });
});
