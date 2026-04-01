import type { ColumnDef } from '../types';
import { createFilterSelectOptionLabelMap, getCellValue } from './columnValues';
import { isActionColumn } from './rowActions';

interface SearchableColumnRuntime<TRow> {
  column: ColumnDef<TRow>;
  optionLabels?: Map<string, string>;
}

function matchesText(value: unknown, normalizedSearch: string): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => matchesText(item, normalizedSearch));
  }

  const text = String(value).trim();
  return text.length > 0 && text.toLowerCase().includes(normalizedSearch);
}

function matchesOptionLabel(
  value: unknown,
  normalizedSearch: string,
  optionLabels?: Map<string, string>
): boolean {
  if (!optionLabels || value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) =>
      matchesOptionLabel(item, normalizedSearch, optionLabels)
    );
  }

  const label = optionLabels.get(String(value));
  return label !== undefined && label.toLowerCase().includes(normalizedSearch);
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

  const searchableColumns: SearchableColumnRuntime<TRow>[] = [];

  columns.forEach((column) => {
    if (isActionColumn(column) || column.searchable === false) {
      return;
    }

    searchableColumns.push({
      column,
      optionLabels: createFilterSelectOptionLabelMap(
        column.filterSelectOptions
      ),
    });
  });

  if (!searchableColumns.length) {
    return rows;
  }

  return rows.filter((row) => {
    for (const searchableColumn of searchableColumns) {
      const { column, optionLabels } = searchableColumn;
      const rawValue = getCellValue(row, column);

      if (matchesText(rawValue, normalizedSearch)) {
        return true;
      }

      if (
        column.valueFormatter &&
        matchesText(column.valueFormatter(rawValue, row), normalizedSearch)
      ) {
        return true;
      }

      if (matchesOptionLabel(rawValue, normalizedSearch, optionLabels)) {
        return true;
      }
    }

    return false;
  });
}
