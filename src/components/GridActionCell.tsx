import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

import { MoreHorizontalIcon } from './icons';
import { resolveRowActionsSource } from '../utils/rowActions';
import type {
  ColumnLayoutItem,
  GridActionDisplayMode,
  GridRowActionIcon,
  GridRowActionItem,
  RowActionMenuIconProps,
} from '../types';

interface GridActionCellProps<TRow> {
  row: TRow;
  rowId: string;
  rowIndex: number;
  columnLayout: ColumnLayoutItem<TRow>;
  dividerColor: string;
  cellPadding: number;
  onPress: (row: TRow, rowId: string, event: GestureResponderEvent) => void;
}

const PREVIEW_POSITION = {
  pageX: 0,
  pageY: 0,
};

function renderActionIcon(
  icon: GridRowActionIcon | undefined,
  iconProps: RowActionMenuIconProps
) {
  if (!icon) {
    return null;
  }

  return typeof icon === 'function' ? icon(iconProps) : icon;
}

function resolveDisplayMode<TRow>(
  action: GridRowActionItem<TRow> | null,
  display: GridActionDisplayMode | undefined,
  hasLabel: boolean,
  hasIcon: boolean
): GridActionDisplayMode {
  if (display) {
    return display;
  }

  if (action?.displayInCell) {
    return action.displayInCell;
  }

  if (hasIcon && hasLabel) {
    return 'both';
  }

  return hasIcon ? 'icon' : 'label';
}

function GridActionCellComponent<TRow>({
  row,
  rowId,
  rowIndex: _rowIndex,
  columnLayout,
  dividerColor,
  cellPadding,
  onPress,
}: GridActionCellProps<TRow>) {
  const column = columnLayout.column;
  const previewParams = useMemo(
    () => ({
      position: PREVIEW_POSITION,
      row,
      rowId,
    }),
    [row, rowId]
  );
  const actions = useMemo(
    () => resolveRowActionsSource(column.actions, previewParams),
    [column.actions, previewParams]
  );
  const explicitTrigger = column.actionTrigger;

  const widthStyle = useMemo(
    () => ({
      width: columnLayout.width,
      borderRightColor: dividerColor,
      paddingHorizontal: cellPadding,
    }),
    [cellPadding, columnLayout.width, dividerColor]
  );

  const singleAction = actions.length === 1 ? actions[0] ?? null : null;
  const triggerLabel =
    explicitTrigger?.label ??
    (singleAction
      ? singleAction.cellLabel ?? singleAction.label ?? ''
      : column.headerName);
  const hasLabel = triggerLabel.trim().length > 0;
  const triggerIcon = explicitTrigger?.icon ?? singleAction?.icon;
  const hasCustomIcon = Boolean(triggerIcon);
  const displayMode = resolveDisplayMode(
    singleAction,
    explicitTrigger?.display,
    hasLabel,
    hasCustomIcon || actions.length > 1
  );
  const iconColor =
    singleAction?.disabled === true
      ? '#9CA3AF'
      : singleAction?.destructive === true
      ? '#B91C1C'
      : '#2563EB';
  const iconProps = useMemo<RowActionMenuIconProps>(
    () => ({
      color: iconColor,
      size: 18,
    }),
    [iconColor]
  );
  const iconNode =
    displayMode === 'label'
      ? null
      : renderActionIcon(triggerIcon, iconProps) ?? (
          <MoreHorizontalIcon color={iconColor} size={18} />
        );

  if (!actions.length) {
    return <View style={[styles.container, widthStyle]} />;
  }

  const isSingleActionDisabled = singleAction?.disabled === true;
  const hasVisibleLabel = displayMode !== 'icon' && hasLabel;
  const chipStyle = isSingleActionDisabled
    ? styles.triggerDisabled
    : singleAction?.destructive === true
    ? styles.triggerDestructive
    : styles.triggerDefault;

  return (
    <Pressable
      onPress={(event) => onPress(row, rowId, event)}
      style={[styles.container, widthStyle]}
    >
      <View
        style={[
          styles.trigger,
          chipStyle,
          hasVisibleLabel ? styles.triggerWide : styles.triggerCompact,
        ]}
      >
        {iconNode ? (
          <View
            style={[
              styles.iconSlot,
              !hasVisibleLabel && styles.iconSlotStandalone,
            ]}
          >
            {iconNode}
          </View>
        ) : null}
        {hasVisibleLabel ? (
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              isSingleActionDisabled && styles.labelDisabled,
              singleAction?.destructive === true && styles.labelDestructive,
            ]}
          >
            {triggerLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const GridActionCell = React.memo(
  GridActionCellComponent
) as typeof GridActionCellComponent;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 32,
    paddingVertical: 6,
  },
  trigger: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 30,
  },
  triggerCompact: {
    minWidth: 32,
    paddingHorizontal: 8,
  },
  triggerWide: {
    maxWidth: '100%',
    paddingHorizontal: 10,
  },
  triggerDefault: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  triggerDestructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  triggerDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  iconSlotStandalone: {
    marginRight: 0,
  },
  label: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '600',
  },
  labelDestructive: {
    color: '#B91C1C',
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
});
