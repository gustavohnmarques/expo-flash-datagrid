import type { ColumnDef, SortModel } from '../types';
import { isActionColumn } from './rowActions';

function getCellValue<TRow>(row: TRow, column: ColumnDef<TRow>): unknown {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }

  return (row as Record<string, unknown>)[column.field];
}

function parseDateLike(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
  }

  return Number.NEGATIVE_INFINITY;
}

function compareByType(
  columnType: ColumnDef<unknown>['type'],
  a: unknown,
  b: unknown
): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }

  switch (columnType) {
    case 'number': {
      const numA = Number(a);
      const numB = Number(b);
      if (Number.isNaN(numA) && Number.isNaN(numB)) {
        return 0;
      }
      if (Number.isNaN(numA)) {
        return -1;
      }
      if (Number.isNaN(numB)) {
        return 1;
      }
      return numA - numB;
    }
    case 'date':
    case 'datetime': {
      return parseDateLike(a) - parseDateLike(b);
    }
    case 'boolean': {
      return Number(Boolean(a)) - Number(Boolean(b));
    }
    default: {
      return String(a).localeCompare(String(b));
    }
  }
}

export function applySorting<TRow>(
  rows: TRow[],
  columns: ColumnDef<TRow>[],
  sortModel: SortModel
): TRow[] {
  if (!sortModel.length) {
    return rows;
  }

  const columnsByField = new Map(
    columns.map((column) => [column.field, column])
  );
  const validSortItems = sortModel.filter(
    (sortItem) => sortItem.sort && columnsByField.has(sortItem.field)
  );

  if (!validSortItems.length) {
    return rows;
  }

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      for (const sortItem of validSortItems) {
        const column = columnsByField.get(sortItem.field);
        if (!column || isActionColumn(column)) {
          continue;
        }

        const leftValue = getCellValue(left.row, column);
        const rightValue = getCellValue(right.row, column);

        let comparison = 0;
        if (column.sortComparator) {
          comparison = column.sortComparator(
            leftValue,
            rightValue,
            left.row,
            right.row
          );
        } else {
          comparison = compareByType(column.type, leftValue, rightValue);
        }

        if (comparison !== 0) {
          return sortItem.sort === 'asc' ? comparison : -comparison;
        }
      }

      // Stable sorting: preserve source order when all comparators tie.
      return left.index - right.index;
    })
    .map((item) => item.row);
}
