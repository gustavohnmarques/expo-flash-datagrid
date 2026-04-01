import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatLocale } from '../localization/localeText';
import { getPaginationRange } from '../utils/pagination';
import type { DataGridLocaleText, PaginationModel } from '../types';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationFooterProps {
  paginationModel: PaginationModel;
  pageSizeOptions: number[];
  rowCount: number;
  rangePaginationModel?: PaginationModel;
  rangeRowCount?: number;
  footerHeight: number;
  footerBackground: string;
  borderColor: string;
  loading?: boolean;
  infinite?: boolean;
  localeText: DataGridLocaleText;
  onPaginationModelChange: (next: PaginationModel) => void;
}

export const PaginationFooter = React.memo(function PaginationFooter({
  paginationModel,
  pageSizeOptions,
  rowCount,
  rangePaginationModel,
  rangeRowCount,
  footerHeight,
  footerBackground,
  borderColor,
  loading,
  infinite,
  localeText,
  onPaginationModelChange,
}: PaginationFooterProps) {
  const [isPageSizeMenuVisible, setIsPageSizeMenuVisible] = useState(false);
  const [draftPageSize, setDraftPageSize] = useState(paginationModel.pageSize);
  const resolvedRangePaginationModel = rangePaginationModel ?? paginationModel;
  const resolvedRangeRowCount = rangeRowCount ?? rowCount;
  const range = useMemo(
    () =>
      getPaginationRange(resolvedRangeRowCount, resolvedRangePaginationModel),
    [resolvedRangePaginationModel, resolvedRangeRowCount]
  );

  const currentPage = Math.max(0, paginationModel.page);
  const pageCount = Math.max(
    1,
    Math.ceil(rowCount / Math.max(1, paginationModel.pageSize))
  );
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage + 1 < pageCount;

  const goPrev = () => {
    if (!canGoPrev) {
      return;
    }
    onPaginationModelChange({
      ...paginationModel,
      page: Math.max(0, paginationModel.page - 1),
    });
  };

  const goNext = () => {
    if (!canGoNext) {
      return;
    }
    onPaginationModelChange({
      ...paginationModel,
      page: paginationModel.page + 1,
    });
  };

  const openPageSizeMenu = () => {
    setDraftPageSize(paginationModel.pageSize);
    setIsPageSizeMenuVisible(true);
  };

  const closePageSizeMenu = () => {
    setDraftPageSize(paginationModel.pageSize);
    setIsPageSizeMenuVisible(false);
  };

  const applyPageSize = () => {
    if (draftPageSize !== paginationModel.pageSize) {
      onPaginationModelChange({
        page: 0,
        pageSize: draftPageSize,
      });
    }

    setIsPageSizeMenuVisible(false);
  };

  if (infinite) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: footerBackground,
            borderTopColor: borderColor,
            minHeight: footerHeight,
          },
        ]}
      >
        <Text style={styles.rangeLabel}>
          {loading
            ? localeText.loadingMoreRows
            : formatLocale(localeText.rowsLoadedLabel, {
                count: resolvedRangeRowCount,
              })}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: footerBackground,
            borderTopColor: borderColor,
            minHeight: footerHeight,
          },
        ]}
      >
        <View style={styles.controlsRow}>
          <View style={styles.pageSizeRow}>
            <Text style={styles.rowsLabel}>{localeText.rowsPerPage}:</Text>
            <Pressable
              onPress={openPageSizeMenu}
              style={styles.pageSizeSelector}
            >
              <Text style={styles.pageSizeValue}>
                {paginationModel.pageSize}
              </Text>
              <ChevronDownIcon color="#6B7280" size={12} />
            </Pressable>
          </View>

          <Text style={styles.rangeLabel}>
            {range.from}-{range.to} {localeText.ofLabel} {range.total}
          </Text>

          <Pressable
            onPress={goPrev}
            style={[styles.iconButton, !canGoPrev && styles.navButtonDisabled]}
          >
            <ChevronLeftIcon color="#6B7280" size={18} />
          </Pressable>

          <Pressable
            onPress={goNext}
            style={[styles.iconButton, !canGoNext && styles.navButtonDisabled]}
          >
            <ChevronRightIcon color="#6B7280" size={18} />
          </Pressable>
        </View>
      </View>
      <Modal
        animationType="slide"
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible={isPageSizeMenuVisible}
        onRequestClose={closePageSizeMenu}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closePageSizeMenu} />
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Pressable
                  onPress={closePageSizeMenu}
                  style={styles.modalHeaderButton}
                >
                  <Text style={styles.modalCancelLabel}>
                    {localeText.cancel}
                  </Text>
                </Pressable>
                <Text numberOfLines={1} style={styles.modalTitle}>
                  {localeText.rowsPerPage}
                </Text>
                <Pressable
                  onPress={applyPageSize}
                  style={styles.modalHeaderButton}
                >
                  <Text style={styles.closeLabel}>
                    {localeText.searchApply}
                  </Text>
                </Pressable>
              </View>

              <ScrollView style={styles.optionsList}>
                {pageSizeOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setDraftPageSize(option)}
                    style={styles.optionItem}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        option === draftPageSize && styles.optionLabelActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pageSizeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 12,
  },
  rowsLabel: {
    color: '#374151',
    fontSize: 14,
    marginRight: 6,
  },
  pageSizeSelector: {
    alignItems: 'center',
    borderRadius: 4,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pageSizeValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    marginLeft: 8,
    width: 28,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  rangeLabel: {
    color: '#374151',
    fontSize: 14,
    marginRight: 8,
  },
  modalOverlay: {
    backgroundColor: 'rgba(17, 24, 39, 0.26)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSafeArea: {
    maxHeight: '60%',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    minHeight: 180,
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 40,
  },
  modalHeaderButton: {
    justifyContent: 'center',
    minWidth: 72,
  },
  modalCancelLabel: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    color: '#111827',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeLabel: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  optionsList: {
    maxHeight: 260,
  },
  optionItem: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  optionLabel: {
    color: '#111827',
    fontSize: 16,
  },
  optionLabelActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
