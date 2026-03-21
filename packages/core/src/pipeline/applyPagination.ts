import type { PaginationState } from "../types/index.js";

export function getPageCount(totalRows: number, pageSize: number): number {
  const normalizedPageSize = Math.max(1, pageSize);

  if (totalRows === 0) {
    return 0;
  }

  return Math.ceil(totalRows / normalizedPageSize);
}

export function applyPagination<TData>(
  data: readonly TData[],
  pagination: PaginationState,
): TData[] {
  const pageSize = Math.max(1, pagination.pageSize);
  const page = Math.max(0, pagination.page);
  const start = page * pageSize;

  return data.slice(start, start + pageSize);
}

