import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  GridPressPosition,
  GridRowActionIcon,
  RowActionMenuIconProps,
} from '../types';

interface RowActionMenuItem {
  key: string;
  label?: string;
  icon?: GridRowActionIcon;
  disabled?: boolean;
  destructive?: boolean;
  onPress: () => void;
}

interface RowActionMenuProps {
  visible: boolean;
  anchor: GridPressPosition | null;
  items: RowActionMenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 220;
const MENU_ITEM_HEIGHT = 52;
const MENU_PADDING = 10;
const SCREEN_GAP = 12;
const MENU_ICON_SIZE = 18;

function resolveIconColor(item: RowActionMenuItem) {
  if (item.disabled) {
    return '#9CA3AF';
  }

  if (item.destructive) {
    return '#B91C1C';
  }

  return '#111827';
}

export const RowActionMenu = React.memo(function RowActionMenu({
  visible,
  anchor,
  items,
  onClose,
}: RowActionMenuProps) {
  const { width, height } = useWindowDimensions();

  const position = useMemo(() => {
    if (!anchor) {
      return { left: SCREEN_GAP, top: SCREEN_GAP };
    }

    const estimatedHeight =
      MENU_PADDING * 2 + Math.min(items.length, 5) * MENU_ITEM_HEIGHT;
    const left = Math.min(
      Math.max(SCREEN_GAP, anchor.pageX + 8),
      width - MENU_WIDTH - SCREEN_GAP
    );
    const top = Math.min(
      Math.max(SCREEN_GAP, anchor.pageY - 12),
      height - estimatedHeight - SCREEN_GAP
    );

    return { left, top };
  }, [anchor, height, items.length, width]);

  const renderIcon = (item: RowActionMenuItem) => {
    if (!item.icon) {
      return null;
    }

    if (typeof item.icon === 'function') {
      const iconProps: RowActionMenuIconProps = {
        color: resolveIconColor(item),
        size: MENU_ICON_SIZE,
      };

      return item.icon(iconProps);
    }

    return item.icon;
  };

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
          <View pointerEvents="box-none" style={[styles.menuLayer, position]}>
            <View style={styles.menuCard}>
              <ScrollView
                bounces={false}
                contentContainerStyle={styles.menuContent}
                style={styles.menuScroll}
              >
                {items.map((item) => {
                  const hasLabel = Boolean(item.label?.trim());

                  return (
                    <Pressable
                      key={item.key}
                      disabled={item.disabled}
                      onPress={item.onPress}
                      style={[
                        styles.menuItem,
                        !hasLabel && styles.menuItemIconOnly,
                        item.disabled && styles.menuItemDisabled,
                      ]}
                    >
                      {item.icon ? (
                        <View
                          style={[
                            styles.iconSlot,
                            !hasLabel && styles.iconSlotStandalone,
                          ]}
                        >
                          {renderIcon(item)}
                        </View>
                      ) : null}
                      {hasLabel ? (
                        <Text
                          style={[
                            styles.menuLabel,
                            item.destructive && styles.menuLabelDestructive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(17, 24, 39, 0.12)',
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  menuLayer: {
    position: 'absolute',
    width: MENU_WIDTH,
  },
  menuCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    elevation: 10,
    maxHeight: MENU_PADDING * 2 + MENU_ITEM_HEIGHT * 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  menuScroll: {
    maxHeight: MENU_PADDING * 2 + MENU_ITEM_HEIGHT * 5,
  },
  menuContent: {
    paddingVertical: MENU_PADDING,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: MENU_ITEM_HEIGHT,
    paddingHorizontal: 18,
  },
  menuItemIconOnly: {
    justifyContent: 'center',
  },
  menuItemDisabled: {
    opacity: 0.45,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 18,
  },
  iconSlotStandalone: {
    marginRight: 0,
  },
  menuLabel: {
    color: '#111827',
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuLabelDestructive: {
    color: '#B91C1C',
  },
});
