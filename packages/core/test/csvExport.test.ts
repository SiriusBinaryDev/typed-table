import { describe, expect, it } from "vitest";

import {
  column,
  createColumns,
  createGroupedRows,
  createHeaders,
  createRows,
  exportTableToCsv,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
  notes: string;
  age: number;
};

const columns = createColumns<User>([
  column("name", { header: "Name" }),
  column("notes", { header: "Notes" }),
  column("age", { header: "Age" }),
]);

describe("exportTableToCsv", () => {
  it("exports headers and data rows using the visible table model", () => {
    const headers = createHeaders(columns, null);
    const rows = createRows(
      [
        { id: "1", name: "Ada", notes: "alpha", age: 36 },
        { id: "2", name: "Grace", notes: "beta", age: 44 },
      ],
      {
        columns,
        getRowId: (row) => row.id,
      },
    );

    expect(exportTableToCsv({ headers, rows })).toBe(
      ["Name,Notes,Age", "Ada,alpha,36", "Grace,beta,44"].join("\n"),
    );
  });

  it("escapes delimiters, quotes, and newlines", () => {
    const headers = createHeaders(columns, null);
    const rows = createRows(
      [
        {
          id: "1",
          name: 'Ada, "Admin"',
          notes: "line 1\nline 2",
          age: 36,
        },
      ],
      {
        columns,
        getRowId: (row) => row.id,
      },
    );

    expect(exportTableToCsv({ headers, rows })).toBe(
      ['Name,Notes,Age', '"Ada, ""Admin""","line 1\nline 2",36'].join("\n"),
    );
  });

  it("supports grouped rows and can exclude them when exporting", () => {
    const grouped = createGroupedRows(
      [
        { id: "1", name: "Ada", notes: "first", age: 36 },
        { id: "2", name: "Ada", notes: "second", age: 28 },
      ],
      {
        allColumns: columns,
        visibleColumns: columns,
        grouping: ["name"],
        getRowId: (row) => row.id,
      },
    );
    const headers = createHeaders(columns, null);

    expect(exportTableToCsv({ headers, rows: grouped.rows })).toBe(
      ["Name,Notes,Age", "Ada,,", "Ada,first,36", "Ada,second,28"].join("\n"),
    );
    expect(
      exportTableToCsv(
        { headers, rows: grouped.rows },
        { includeGroupRows: false },
      ),
    ).toBe(["Name,Notes,Age", "Ada,first,36", "Ada,second,28"].join("\n"));
  });

  it("supports custom header and cell serialization", () => {
    const headers = createHeaders(columns, null);
    const rows = createRows(
      [{ id: "1", name: "Ada", notes: "alpha", age: 36 }],
      {
        columns,
        getRowId: (row) => row.id,
      },
    );

    expect(
      exportTableToCsv(
        { headers, rows },
        {
          delimiter: ";",
          getHeaderValue: (header) => header.id.toUpperCase(),
          getCellValue: (cell) =>
            cell.columnId === "age" ? `${cell.value} years` : cell.value,
        },
      ),
    ).toBe(["NAME;NOTES;AGE", "Ada;alpha;36 years"].join("\n"));
  });
});
