import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ColumnLayoutItem, DataGridSortIcons, SortModel } from '../types';
import { isActionColumn } from '../utils/rowActions';
import { ChevronDownIcon, ChevronUpIcon } from './icons';

const ALIGN_STYLE = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});

interface GridHeaderProps<TRow> {
  columns: ColumnLayoutItem<TRow>[];
  sortModel: SortModel;
  onSortPress?: (field: string) => void;
  headerHeight: number;
  headerBackground: string;
  headerTextColor: string;
  borderColor: string;
  dividerColor: string;
  cellPadding: number;
  checkboxSelection?: boolean;
  sortIcons?: DataGridSortIcons;
  showUnsortedSortIcon?: boolean;
}

function GridHeaderComponent<TRow>({
  columns,
  sortModel,
  onSortPress,
  headerHeight,
  headerBackground,
  headerTextColor,
  borderColor,
  dividerColor,
  cellPadding,
  checkboxSelection,
  sortIcons,
  showUnsortedSortIcon,
}: GridHeaderProps<TRow>) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: headerBackground,
          borderBottomColor: borderColor,
          minHeight: headerHeight,
        },
      ]}
    >
      {checkboxSelection === true ? (
        <View
          style={[styles.selectionCell, { borderRightColor: dividerColor }]}
        />
      ) : null}

      {columns.map((columnLayout) => {
        const column = columnLayout.column;
        const sortState = sortModel.find(
          (item) => item.field === column.field
        )?.sort;
        const sortable = !isActionColumn(column) && column.sortable !== false;
        const sortIndicator =
          sortState === 'asc'
            ? sortIcons?.asc ?? (
                <ChevronUpIcon color={headerTextColor} size={12} />
              )
            : sortState === 'desc'
            ? sortIcons?.desc ?? (
                <ChevronDownIcon color={headerTextColor} size={12} />
              )
            : showUnsortedSortIcon
            ? sortIcons?.none ?? null
            : null;

        return (
          <Pressable
            key={column.field}
            style={[
              styles.cell,
              {
                width: columnLayout.width,
                borderRightColor: dividerColor,
                paddingHorizontal: cellPadding,
              },
            ]}
            onPress={
              sortable && onSortPress
                ? () => onSortPress(column.field)
                : undefined
            }
          >
            {column.renderHeader ? (
              column.renderHeader({
                column,
                sortDirection: sortState,
              })
            ) : (
              <View style={styles.labelRow}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    ALIGN_STYLE[column.headerAlign ?? 'left'],
                    { color: headerTextColor },
                  ]}
                >
                  {column.headerName}
                </Text>

                {sortable && sortIndicator ? (
                  <View style={styles.sortIcon}>{sortIndicator}</View>
                ) : null}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export const GridHeader = React.memo(
  GridHeaderComponent
) as typeof GridHeaderComponent;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  selectionCell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 42,
  },
  cell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 8,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  sortIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 12,
  },
});
