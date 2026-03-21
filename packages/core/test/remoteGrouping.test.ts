import { describe, expect, it } from "vitest";

import {
  column,
  createColumns,
  createRemoteGroupedRows,
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

describe("createRemoteGroupedRows", () => {
  it("normalizes remote grouped row input and respects row expansion state", () => {
    const grouped = createRemoteGroupedRows<User>([
      {
        type: "group",
        id: "group:name=Ada",
        groupingColumnId: "name",
        groupingValue: "Ada",
        leafRowCount: 2,
        subRows: [
          { original: { id: "1", name: "Ada", age: 36 } },
          { original: { id: "3", name: "Ada", age: 28 } },
        ],
      },
      {
        type: "group",
        id: "group:name=Grace",
        groupingColumnId: "name",
        groupingValue: "Grace",
        subRows: [
          { original: { id: "2", name: "Grace", age: 44 } },
        ],
      },
    ], {
      visibleColumns: columns,
      rowExpansion: {
        "group:name=Ada": false,
      },
      getRowId: (row) => row.id,
    })

    expect(grouped.rootRows.map((row) => row.id)).toEqual([
      "group:name=Ada",
      "group:name=Grace",
    ]);
    expect(grouped.rows.map((row) => row.id)).toEqual([
      "group:name=Ada",
      "group:name=Grace",
      "2",
    ]);
    expect(grouped.rows[0]).toMatchObject({
      type: "group",
      canExpand: true,
      isExpanded: false,
      groupingColumnId: "name",
      groupingValue: "Ada",
      leafRowCount: 2,
    });
    expect(grouped.rootRows[1]?.leafRowCount).toBe(1);
    expect(grouped.rootRows[1]?.subRows[0]).toMatchObject({
      id: "2",
      type: "data",
      parentId: "group:name=Grace",
      depth: 1,
    });
  });
});
