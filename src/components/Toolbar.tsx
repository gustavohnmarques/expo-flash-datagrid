import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLocale } from '../localization/localeText';
import type { DataGridLocaleText } from '../types';

interface ToolbarProps {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  localeText: DataGridLocaleText;
  hasActiveSearch: boolean;
  hasActiveFilters: boolean;
  selectionCount: number;
  title?: React.ReactNode;
  onOpenSearch: () => void;
  onOpenFilters: () => void;
  onOpenColumns: () => void;
  onClearSelection?: () => void;
}

function ToolbarIconButton({
  accessibilityLabel,
  active,
  onPress,
  children,
}: {
  accessibilityLabel: string;
  active?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.iconButton, active && styles.iconButtonActive]}
    >
      {children}
    </Pressable>
  );
}

export const Toolbar = React.memo(function Toolbar({
  backgroundColor,
  borderColor,
  textColor,
  localeText,
  hasActiveSearch,
  hasActiveFilters,
  selectionCount,
  title,
  onOpenSearch,
  onOpenFilters,
  onOpenColumns,
  onClearSelection,
}: ToolbarProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderBottomColor: borderColor },
      ]}
    >
      <View style={styles.row}>
        {title ? (
          typeof title === 'string' ? (
            <Text
              numberOfLines={1}
              style={[styles.title, { color: textColor }]}
            >
              {title}
            </Text>
          ) : (
            <View style={styles.titleContainer}>{title}</View>
          )
        ) : null}

        <View style={styles.rightIcons}>
          <ToolbarIconButton
            accessibilityLabel={localeText.toolbarColumns}
            onPress={onOpenColumns}
          >
            <MaterialIcons color="#6B7280" name="view-column" size={22} />
          </ToolbarIconButton>

          <ToolbarIconButton
            accessibilityLabel={localeText.toolbarFilters}
            active={hasActiveFilters}
            onPress={onOpenFilters}
          >
            <MaterialIcons
              color={hasActiveFilters ? '#1D4ED8' : '#6B7280'}
              name="filter-list"
              size={22}
            />
          </ToolbarIconButton>

          <ToolbarIconButton
            accessibilityLabel={localeText.toolbarSearch}
            active={hasActiveSearch}
            onPress={onOpenSearch}
          >
            <MaterialIcons
              color={hasActiveSearch ? '#1D4ED8' : '#6B7280'}
              name="search"
              size={22}
            />
          </ToolbarIconButton>
        </View>
      </View>

      {selectionCount > 0 ? (
        <View style={styles.selectionRow}>
          <Text style={styles.selectionLabel}>
            {formatLocale(localeText.selectedRowsLabel, {
              count: selectionCount,
            })}
          </Text>
          {onClearSelection ? (
            <Pressable onPress={onClearSelection}>
              <Text style={styles.clearSelection}>
                {localeText.clearSelection}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rightIcons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  titleContainer: {
    flexShrink: 1,
    marginRight: 10,
  },
  title: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
    textAlign: 'right',
  },
  iconButton: {
    alignItems: 'center',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  selectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  selectionLabel: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '600',
  },
  clearSelection: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
});
