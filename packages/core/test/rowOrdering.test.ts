import { describe, expect, it } from "vitest";

import {
  applyRowOrder,
  clearRowOrder,
  createTableState,
  moveRow,
  setRowOrder,
} from "@typed-table/core";

type User = {
  id: string;
  name: string;
};

const users: User[] = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Grace" },
  { id: "3", name: "Lin" },
];

describe("row ordering", () => {
  it("sets, moves, and clears explicit row order", () => {
    const ordered = setRowOrder(createTableState(), ["3", "1", "3"]);
    const moved = moveRow(ordered, "1", 0, users.map((user) => user.id));
    const cleared = clearRowOrder(moved);

    expect(ordered.rowOrder).toEqual(["3", "1"]);
    expect(moved.rowOrder).toEqual(["1", "3", "2"]);
    expect(cleared.rowOrder).toEqual([]);
  });

  it("applies row order before later pipeline steps", () => {
    const ordered = applyRowOrder(
      users,
      ["3", "1", "missing"],
      (row) => row.id,
    );

    expect(ordered.map((user) => user.id)).toEqual(["3", "1", "2"]);
  });

  it("leaves data unchanged when no stable row id getter exists", () => {
    const ordered = applyRowOrder(users, ["3", "1"], undefined);

    expect(ordered).toEqual(users);
  });
});
