import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

import { GridActionCell } from './GridActionCell';
import { isActionColumn } from '../utils/rowActions';
import type {
  CellEventParams,
  CellRenderParams,
  ColumnLayoutItem,
} from '../types';

const ALIGN_STYLE = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});

const LONG_PRESS_DELAY_MS = 220;

interface GridCellProps<TRow> {
  row: TRow;
  rowId: string;
  rowIndex: number;
  columnLayout: ColumnLayoutItem<TRow>;
  isSelected: boolean;
  textColor: string;
  dividerColor: string;
  cellPadding: number;
  onCellPress?: (params: CellEventParams<TRow>) => void;
  onCellLongPress?: (
    params: CellEventParams<TRow>,
    event: GestureResponderEvent
  ) => void;
  onActionCellPress?: (
    row: TRow,
    rowId: string,
    column: ColumnLayoutItem<TRow>['column'],
    event: GestureResponderEvent
  ) => void;
}

function GridCellComponent<TRow>({
  row,
  rowId,
  rowIndex,
  columnLayout,
  isSelected,
  textColor,
  dividerColor,
  cellPadding,
  onCellPress,
  onCellLongPress,
  onActionCellPress,
}: GridCellProps<TRow>) {
  const column = columnLayout.column;
  const rawValue = column.valueGetter
    ? column.valueGetter(row)
    : (row as Record<string, unknown>)[column.field];

  const cellRenderParams = useMemo<CellRenderParams<TRow>>(
    () => ({
      row,
      value: rawValue,
      rowId,
      field: column.field,
      rowIndex,
      column,
      isSelected,
    }),
    [column, isSelected, rawValue, row, rowId, rowIndex]
  );

  const textValue = useMemo(() => {
    if (column.valueFormatter) {
      return column.valueFormatter(rawValue, row);
    }

    if (rawValue === null || rawValue === undefined) {
      return '';
    }

    return String(rawValue);
  }, [column, rawValue, row]);

  const widthStyle = useMemo(
    () => ({
      width: columnLayout.width,
      borderRightColor: dividerColor,
      paddingHorizontal: cellPadding,
    }),
    [cellPadding, columnLayout.width, dividerColor]
  );

  const align = column.align ?? 'left';

  if (isActionColumn(column) && onActionCellPress) {
    return (
      <GridActionCell
        cellPadding={cellPadding}
        columnLayout={columnLayout}
        dividerColor={dividerColor}
        row={row}
        rowId={rowId}
        rowIndex={rowIndex}
        onPress={(actionRow, actionRowId, event) =>
          onActionCellPress(actionRow, actionRowId, column, event)
        }
      />
    );
  }

  return (
    <Pressable
      delayLongPress={LONG_PRESS_DELAY_MS}
      style={[styles.container, widthStyle]}
      onPress={onCellPress ? () => onCellPress({ row, column }) : undefined}
      onLongPress={
        onCellLongPress
          ? (event) => onCellLongPress({ row, column }, event)
          : undefined
      }
    >
      {column.renderCell ? (
        <View style={styles.customCell}>
          {column.renderCell(cellRenderParams)}
        </View>
      ) : (
        <Text
          numberOfLines={1}
          style={[styles.text, ALIGN_STYLE[align], { color: textColor }]}
        >
          {textValue}
        </Text>
      )}
    </Pressable>
  );
}

export const GridCell = React.memo(
  GridCellComponent
) as typeof GridCellComponent;

const styles = StyleSheet.create({
  container: {
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 32,
    paddingVertical: 6,
  },
  customCell: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
  },
});
