import { describe, expect, expectTypeOf, it } from "vitest";

import {
  createColumnFactory,
  createColumns,
  createRows,
  type ColumnDef,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  age: number;
  active: boolean;
};

const users: User[] = [
  { id: "1", name: "Ada", age: 36, active: true },
  { id: "2", name: "Grace", age: 44, active: false },
];

describe("createColumnFactory", () => {
  it("preserves callback typing for custom accessors", () => {
    const { column } = createColumnFactory<User>();

    const nameColumn = column("name", {
      accessor: (row) => `${row.name} (${row.age})`,
      sortable: true,
      filterable: true,
      cell: ({ value, row, column }) => {
        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(row).toEqualTypeOf<User>();
        expectTypeOf(column).toEqualTypeOf<ColumnDef<User>>();

        return value.toUpperCase();
      },
      sortFn: (left, right, leftRow, rightRow) => {
        expectTypeOf(left).toEqualTypeOf<string>();
        expectTypeOf(right).toEqualTypeOf<string>();
        expectTypeOf(leftRow).toEqualTypeOf<User>();
        expectTypeOf(rightRow).toEqualTypeOf<User>();

        return left.localeCompare(right);
      },
      filterFn: (value, filterValue, row) => {
        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(filterValue).toEqualTypeOf<unknown>();
        expectTypeOf(row).toEqualTypeOf<User>();

        return value.toLowerCase().includes(String(filterValue).toLowerCase());
      },
    });

    const rows = createRows(users.slice(0, 1), {
      columns: createColumns<User>([nameColumn]),
      getRowId: (row) => row.id,
    });

    expect(rows[0]?.cells[0]?.render()).toBe("ADA (36)");
  });

  it("defaults callback typing to the property value when no accessor is supplied", () => {
    const { column } = createColumnFactory<User>();

    const ageColumn = column("age", {
      cell: ({ value }) => {
        expectTypeOf(value).toEqualTypeOf<number>();

        return value + 1;
      },
      sortFn: (left, right) => {
        expectTypeOf(left).toEqualTypeOf<number>();
        expectTypeOf(right).toEqualTypeOf<number>();

        return left - right;
      },
      filterFn: (value) => {
        expectTypeOf(value).toEqualTypeOf<number>();

        return value >= 18;
      },
    });

    const rows = createRows(users.slice(0, 1), {
      columns: createColumns<User>([ageColumn]),
      getRowId: (row) => row.id,
    });

    expect(rows[0]?.cells[0]?.render()).toBe(37);
  });

  it("supports arbitrary string ids when an accessor is supplied", () => {
    const { column } = createColumnFactory<User>();

    const displayNameColumn = column("displayName", {
      accessor: (row) => `${row.name} (${row.id})`,
      sortable: true,
      filterable: true,
      cell: ({ value }) => {
        expectTypeOf(value).toEqualTypeOf<string>();

        return value.toUpperCase();
      },
      sortFn: (left, right) => {
        expectTypeOf(left).toEqualTypeOf<string>();
        expectTypeOf(right).toEqualTypeOf<string>();

        return left.localeCompare(right);
      },
      filterFn: (value, filterValue) => {
        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(filterValue).toEqualTypeOf<unknown>();

        return value.includes(String(filterValue));
      },
    });

    const rows = createRows(users.slice(0, 1), {
      columns: createColumns<User>([displayNameColumn]),
      getRowId: (row) => row.id,
    });

    expect(rows[0]?.cells[0]?.columnId).toBe("displayName");
    expect(rows[0]?.cells[0]?.render()).toBe("ADA (1)");
  });
});
