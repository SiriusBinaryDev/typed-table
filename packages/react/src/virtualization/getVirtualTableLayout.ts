import type {
  TableCell,
  TableHeader,
  TableInstance,
  TableRow,
} from "@typed-table/core";

export type VirtualHeaderPartitions = {
  left: TableHeader[];
  center: TableHeader[];
  right: TableHeader[];
};

export type VirtualCellPartitions<TData> = {
  left: TableCell<TData>[];
  center: TableCell<TData>[];
  right: TableCell<TData>[];
};

export type VirtualTableLayout<TData> = VirtualHeaderPartitions & {
  headers: TableHeader[];
  rows: TableRow<TData>[];
  leftWidth: number;
  centerWidth: number;
  rightWidth: number;
  totalWidth: number;
};

function sumHeaderWidths(headers: readonly TableHeader[]): number {
  return headers.reduce((total, header) => total + header.size, 0);
}

export function partitionHeadersByPin(
  headers: readonly TableHeader[],
): VirtualHeaderPartitions {
  const left: TableHeader[] = [];
  const center: TableHeader[] = [];
  const right: TableHeader[] = [];

  for (const header of headers) {
    if (header.pin === "left") {
      left.push(header);
      continue;
    }

    if (header.pin === "right") {
      right.push(header);
      continue;
    }

    center.push(header);
  }

  return { left, center, right };
}

export function partitionRowCellsByPin<TData>(
  row: Pick<TableRow<TData>, "cells">,
): VirtualCellPartitions<TData> {
  const left: TableCell<TData>[] = [];
  const center: TableCell<TData>[] = [];
  const right: TableCell<TData>[] = [];

  for (const cell of row.cells) {
    if (cell.pin === "left") {
      left.push(cell);
      continue;
    }

    if (cell.pin === "right") {
      right.push(cell);
      continue;
    }

    center.push(cell);
  }

  return { left, center, right };
}

export function getVirtualTableLayout<TData>(
  table: Pick<TableInstance<TData>, "headers" | "rows">,
): VirtualTableLayout<TData> {
  const { left, center, right } = partitionHeadersByPin(table.headers);
  const leftWidth = sumHeaderWidths(left);
  const centerWidth = sumHeaderWidths(center);
  const rightWidth = sumHeaderWidths(right);

  return {
    headers: table.headers,
    rows: table.rows,
    left,
    center,
    right,
    leftWidth,
    centerWidth,
    rightWidth,
    totalWidth: leftWidth + centerWidth + rightWidth,
  };
}
