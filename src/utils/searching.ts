import type { ColumnDef } from '../types';
import { isActionColumn } from './rowActions';

function getCellValue<TRow>(row: TRow, column: ColumnDef<TRow>): unknown {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }

  return (row as Record<string, unknown>)[column.field];
}

export function applySearch<TRow>(
  rows: TRow[],
  columns: ColumnDef<TRow>[],
  searchText: string
): TRow[] {
  const normalizedSearch = searchText.trim().toLowerCase();
  if (!normalizedSearch) {
    return rows;
  }

  const searchableColumns = columns.filter(
    (column) => !isActionColumn(column) && column.searchable === true
  );
  if (!searchableColumns.length) {
    return rows;
  }

  return rows.filter((row) => {
    for (const column of searchableColumns) {
      const rawValue = getCellValue(row, column);
      const value = column.valueFormatter
        ? column.valueFormatter(rawValue, row)
        : rawValue;

      if (
        String(value ?? '')
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return true;
      }
    }

    return false;
  });
}
