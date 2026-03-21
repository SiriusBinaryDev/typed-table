export type RowDropTargetId = string | null | undefined;

export function getRowDropTargetIndex(
  rowIds: readonly string[],
  activeId: string,
  overId: RowDropTargetId,
): number | null {
  if (!overId || activeId === overId) {
    return null;
  }

  const activeIndex = rowIds.indexOf(activeId);
  const overIndex = rowIds.indexOf(overId);

  if (activeIndex < 0 || overIndex < 0) {
    return null;
  }

  return overIndex;
}

export function reorderRowIds(
  rowIds: readonly string[],
  activeId: string,
  overId: RowDropTargetId,
): string[] {
  const targetIndex = getRowDropTargetIndex(rowIds, activeId, overId);

  if (targetIndex == null) {
    return [...rowIds];
  }

  const nextRowIds = rowIds.filter((rowId) => rowId !== activeId);
  nextRowIds.splice(targetIndex, 0, activeId);

  return nextRowIds;
}
