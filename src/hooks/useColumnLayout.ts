import { useMemo } from 'react';

import type {
  ColumnLayoutItem,
  ColumnVisibilityModel,
  DataGridProps,
} from '../types';

const DEFAULT_COLUMN_WIDTH = 140;
const DEFAULT_MIN_WIDTH = 96;

interface UseColumnLayoutParams<TRow> {
  columns: DataGridProps<TRow>['columns'];
  columnVisibilityModel: ColumnVisibilityModel;
  containerWidth: number;
}

interface UseColumnLayoutResult<TRow> {
  visibleColumns: ColumnLayoutItem<TRow>[];
  totalWidth: number;
}

export function useColumnLayout<TRow>({
  columns,
  columnVisibilityModel,
  containerWidth,
}: UseColumnLayoutParams<TRow>): UseColumnLayoutResult<TRow> {
  return useMemo(() => {
    const resolvedColumns = columns.filter(
      (column) => columnVisibilityModel[column.field] !== false
    );

    const baseWidths = resolvedColumns.map((column) => {
      const minWidth = column.minWidth ?? DEFAULT_MIN_WIDTH;
      const width = column.width ?? DEFAULT_COLUMN_WIDTH;
      return Math.max(width, minWidth);
    });

    const fixedWidth = resolvedColumns.reduce((acc, column, index) => {
      const baseWidth =
        baseWidths[index] ??
        Math.max(
          column.width ?? DEFAULT_COLUMN_WIDTH,
          column.minWidth ?? DEFAULT_MIN_WIDTH
        );

      if (!column.flex || column.flex <= 0) {
        return acc + baseWidth;
      }

      return acc;
    }, 0);

    const flexWeight = resolvedColumns.reduce((acc, column) => {
      return acc + (column.flex && column.flex > 0 ? column.flex : 0);
    }, 0);

    const remainingWidth = Math.max(containerWidth - fixedWidth, 0);

    const visibleColumns = resolvedColumns.map((column, index) => {
      const baseWidth =
        baseWidths[index] ??
        Math.max(
          column.width ?? DEFAULT_COLUMN_WIDTH,
          column.minWidth ?? DEFAULT_MIN_WIDTH
        );

      if (!column.flex || column.flex <= 0 || flexWeight <= 0) {
        return {
          column,
          width: baseWidth,
        };
      }

      const minWidth = column.minWidth ?? DEFAULT_MIN_WIDTH;
      const flexWidth = (remainingWidth * column.flex) / flexWeight;

      return {
        column,
        width: Math.max(minWidth, Math.round(flexWidth)),
      };
    });

    const totalWidth = Math.max(
      visibleColumns.reduce((acc, column) => acc + column.width, 0),
      containerWidth
    );

    return { visibleColumns, totalWidth };
  }, [columns, columnVisibilityModel, containerWidth]);
}
