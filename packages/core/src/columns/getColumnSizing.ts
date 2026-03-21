import type { ColumnDef, ColumnSizingState } from "../types/index.js";

export const DEFAULT_COLUMN_SIZE = 160;
export const DEFAULT_MIN_COLUMN_SIZE = 48;

function normalizeSize(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value as number));
}

function normalizeMaxSize(
  value: number | undefined,
  minSize: number,
): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(minSize, Math.floor(value as number));
}

export function clampColumnSize(
  size: number,
  minSize: number,
  maxSize: number | null,
): number {
  const normalizedSize = Number.isFinite(size) ? Math.floor(size) : minSize;
  const boundedSize = Math.max(minSize, normalizedSize);

  return maxSize == null ? boundedSize : Math.min(boundedSize, maxSize);
}

export function getColumnSizingInfo<TData>(
  column: ColumnDef<TData>,
  columnSizing?: ColumnSizingState | null,
): {
  baseSize: number;
  size: number;
  minSize: number;
  maxSize: number | null;
  canResize: boolean;
} {
  const minSize = normalizeSize(column.minSize, DEFAULT_MIN_COLUMN_SIZE);
  const maxSize = normalizeMaxSize(column.maxSize, minSize);
  const baseSize = clampColumnSize(
    normalizeSize(column.size, DEFAULT_COLUMN_SIZE),
    minSize,
    maxSize,
  );
  const size = clampColumnSize(
    columnSizing?.[column.id] ?? baseSize,
    minSize,
    maxSize,
  );

  return {
    baseSize,
    size,
    minSize,
    maxSize,
    canResize: column.resizable ?? true,
  };
}
