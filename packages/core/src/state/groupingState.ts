import type { GroupingState } from "../types/index.js";

export function normalizeGroupingState<TData>(
  grouping: readonly string[] | null | undefined,
): GroupingState<TData> {
  if (!grouping?.length) {
    return [];
  }

  const seenColumnIds = new Set<string>();
  const normalizedGrouping: string[] = [];

  for (const columnId of grouping) {
    if (seenColumnIds.has(columnId)) {
      continue;
    }

    seenColumnIds.add(columnId);
    normalizedGrouping.push(columnId);
  }

  return normalizedGrouping as GroupingState<TData>;
}

export function isRowExpanded(
  rowId: string,
  rowExpansion: Record<string, boolean> | null | undefined,
): boolean {
  return rowExpansion?.[rowId] ?? true;
}
