import { describe, expect, it } from "vitest";

import {
  getRowDropTargetIndex,
  reorderRowIds,
} from "@typed-table/react";

describe("row reorder helpers", () => {
  it("returns the drop target index for valid active and over ids", () => {
    expect(getRowDropTargetIndex(["1", "2", "3", "4"], "2", "4")).toBe(3);
    expect(getRowDropTargetIndex(["1", "2", "3", "4"], "4", "2")).toBe(1);
  });

  it("returns null when the drop target is missing or unchanged", () => {
    expect(getRowDropTargetIndex(["1", "2", "3"], "2", null)).toBeNull();
    expect(getRowDropTargetIndex(["1", "2", "3"], "2", "2")).toBeNull();
    expect(getRowDropTargetIndex(["1", "2", "3"], "9", "2")).toBeNull();
    expect(getRowDropTargetIndex(["1", "2", "3"], "2", "9")).toBeNull();
  });

  it("reorders row ids using drag-and-drop style over-id semantics", () => {
    expect(reorderRowIds(["1", "2", "3", "4"], "2", "4")).toEqual(["1", "3", "4", "2"]);
    expect(reorderRowIds(["1", "2", "3", "4"], "4", "2")).toEqual(["1", "4", "2", "3"]);
  });

  it("returns a copied but unchanged order when the drag target is invalid", () => {
    const rowIds = ["1", "2", "3"];
    const nextRowIds = reorderRowIds(rowIds, "2", undefined);

    expect(nextRowIds).toEqual(rowIds);
    expect(nextRowIds).not.toBe(rowIds);
  });
});
