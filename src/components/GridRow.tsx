import React, { useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import { GridCell } from './GridCell';
import type { ColumnDef, ColumnLayoutItem } from '../types';

const LONG_PRESS_DELAY_MS = 220;

interface GridRowProps<TRow> {
  row: TRow;
  rowId: string;
  rowIndex: number;
  columns: ColumnLayoutItem<TRow>[];
  rowHeight: number;
  rowBackground: string;
  rowAltBackground: string;
  rowTextColor: string;
  dividerColor: string;
  selectionBackground: string;
  zebraRows?: boolean;
  getRowStyle?: (row: TRow, index: number) => StyleProp<ViewStyle>;
  isSelected: boolean;
  isContextActive?: boolean;
  checkboxSelection?: boolean;
  onToggleSelection?: (rowId: string) => void;
  onRowPress?: (row: TRow, rowId: string) => void;
  onRowLongPress?: (
    row: TRow,
    rowId: string,
    event: GestureResponderEvent
  ) => void;
  onCellPress?: (row: TRow, rowId: string, column: ColumnDef<TRow>) => void;
  onCellLongPress?: (
    row: TRow,
    rowId: string,
    column: ColumnDef<TRow>,
    event: GestureResponderEvent
  ) => void;
  onActionCellPress?: (
    row: TRow,
    rowId: string,
    column: ColumnDef<TRow>,
    event: GestureResponderEvent
  ) => void;
  cellPadding: number;
}

function GridRowComponent<TRow>({
  row,
  rowId,
  rowIndex,
  columns,
  rowHeight,
  rowBackground,
  rowAltBackground,
  rowTextColor,
  dividerColor,
  selectionBackground,
  zebraRows,
  getRowStyle,
  isSelected,
  isContextActive,
  checkboxSelection,
  onToggleSelection,
  onRowPress,
  onRowLongPress,
  onCellPress,
  onCellLongPress,
  onActionCellPress,
  cellPadding,
}: GridRowProps<TRow>) {
  const customRowStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (!getRowStyle) {
      return undefined;
    }

    return getRowStyle(row, rowIndex);
  }, [getRowStyle, row, rowIndex]);

  const dynamicRowStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const zebraBackground =
      zebraRows && rowIndex % 2 === 1 ? rowAltBackground : rowBackground;

    const baseStyle = {
      backgroundColor: zebraBackground,
      borderLeftColor: isContextActive ? '#2563EB' : 'transparent',
      borderLeftWidth: isContextActive ? 3 : 0,
      borderBottomColor: dividerColor,
      minHeight: rowHeight,
    };

    if (!customRowStyle) {
      return baseStyle;
    }

    return [baseStyle, customRowStyle];
  }, [
    customRowStyle,
    isContextActive,
    rowAltBackground,
    rowBackground,
    rowHeight,
    rowIndex,
    dividerColor,
    zebraRows,
  ]);

  const stateOverlayStyle = useMemo<StyleProp<ViewStyle> | null>(() => {
    if (isSelected) {
      return [
        styles.stateOverlay,
        {
          backgroundColor: selectionBackground,
          opacity: isContextActive ? 0.94 : 0.88,
        },
      ];
    }

    if (isContextActive) {
      return [
        styles.stateOverlay,
        {
          backgroundColor: selectionBackground,
          opacity: 0.5,
        },
      ];
    }

    return null;
  }, [isContextActive, isSelected, selectionBackground]);

  return (
    <Pressable
      delayLongPress={LONG_PRESS_DELAY_MS}
      style={[styles.container, dynamicRowStyle]}
      onPress={onRowPress ? () => onRowPress(row, rowId) : undefined}
      onLongPress={
        onRowLongPress
          ? (event) => onRowLongPress(row, rowId, event)
          : undefined
      }
    >
      {stateOverlayStyle ? (
        <View pointerEvents="none" style={stateOverlayStyle} />
      ) : null}

      {checkboxSelection === true ? (
        <Pressable
          delayLongPress={LONG_PRESS_DELAY_MS}
          style={[styles.selectionCell, { borderRightColor: dividerColor }]}
          hitSlop={6}
          onPress={
            onToggleSelection ? () => onToggleSelection(rowId) : undefined
          }
        >
          <View
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          >
            {isSelected ? (
              <MaterialIcons color="#FFFFFF" name="check" size={14} />
            ) : null}
          </View>
        </Pressable>
      ) : null}

      {columns.map((columnLayout) => (
        <GridCell
          key={columnLayout.column.field}
          row={row}
          rowId={rowId}
          rowIndex={rowIndex}
          columnLayout={columnLayout}
          isSelected={isSelected}
          textColor={rowTextColor}
          dividerColor={dividerColor}
          cellPadding={cellPadding}
          onCellPress={
            onCellPress
              ? ({ column }) => onCellPress(row, rowId, column)
              : undefined
          }
          onCellLongPress={
            onCellLongPress
              ? ({ column }, event) =>
                  onCellLongPress(row, rowId, column, event)
              : undefined
          }
          onActionCellPress={onActionCellPress}
        />
      ))}
    </Pressable>
  );
}

export const GridRow = React.memo(GridRowComponent) as typeof GridRowComponent;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    position: 'relative',
  },
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  selectionCell: {
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingHorizontal: 10,
    width: 42,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#9CA3AF',
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
});
