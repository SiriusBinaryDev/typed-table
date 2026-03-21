import type {
  CsvExportOptions,
  TableCell,
  TableModel,
  TableRow,
} from "../types/index.js";

function serializeCsvValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    typeof value === "symbol"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function escapeCsvValue(value: string, delimiter: string): string {
  const escapedValue = value.replaceAll('"', '""');

  if (
    escapedValue.includes(delimiter) ||
    escapedValue.includes('"') ||
    escapedValue.includes("\n") ||
    escapedValue.includes("\r")
  ) {
    return `"${escapedValue}"`;
  }

  return escapedValue;
}

function getCellByColumnId<TData>(
  row: TableRow<TData>,
  columnId: string,
): TableCell<TData> | null {
  return row.cells.find((cell) => cell.columnId === columnId) ?? null;
}

export function exportTableToCsv<TData>(
  model: Pick<TableModel<TData>, "headers" | "rows">,
  options: CsvExportOptions<TData> = {},
): string {
  const includeHeaders = options.includeHeaders ?? true;
  const includeGroupRows = options.includeGroupRows ?? true;
  const delimiter = options.delimiter ?? ",";
  const newline = options.newline ?? "\n";
  const rows = includeGroupRows
    ? model.rows
    : model.rows.filter((row) => row.type !== "group");
  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(
      model.headers
        .map((header) =>
          escapeCsvValue(
            serializeCsvValue(options.getHeaderValue?.(header) ?? header.label),
            delimiter,
          ),
        )
        .join(delimiter),
    );
  }

  for (const row of rows) {
    lines.push(
      model.headers
        .map((header) => {
          const cell = getCellByColumnId(row, header.id);
          const value =
            cell == null
              ? null
              : options.getCellValue?.(cell, row) ?? cell.value;

          return escapeCsvValue(serializeCsvValue(value), delimiter);
        })
        .join(delimiter),
    );
  }

  return lines.join(newline);
}
