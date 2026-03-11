import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDefaultFilterOperatorsByType } from '../utils/filtering';
import { isActionColumn } from '../utils/rowActions';
import type {
  ColumnDef,
  DataGridLocaleText,
  FilterItem,
  FilterModel,
  FilterOperator,
  FilterOperatorsConfig,
} from '../types';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { areFilterModelsEqual } from '../utils/stateComparison';
import { ChevronDownIcon, PlusIcon, TrashIcon } from './icons';

interface FilterPanelModalProps<TRow> extends FilterOperatorsConfig<TRow> {
  visible: boolean;
  columns: ColumnDef<TRow>[];
  model: FilterModel;
  localeText: DataGridLocaleText;
  maxFilters: number;
  onChange: (next: FilterModel) => void;
  onClose: () => void;
}

type SelectorState = {
  itemId: string;
  type: 'field' | 'operator' | 'booleanValue';
} | null;

let filterSequence = 0;

function createFilterId(): string {
  filterSequence += 1;
  return `filter-${filterSequence}`;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function getStableExternalFilterId(index: number): string {
  return `filter-sync-${index}`;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return null;
}

function SelectField({
  label,
  value,
  onPress,
  disabled,
}: {
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.selectField, disabled && styles.selectFieldDisabled]}
    >
      <Text style={styles.selectLabel}>{label}</Text>
      <View style={styles.selectValueRow}>
        <Text numberOfLines={1} style={styles.selectValue}>
          {value}
        </Text>
        {!disabled ? <ChevronDownIcon size={12} /> : null}
      </View>
    </Pressable>
  );
}

function FilterPanelModalComponent<TRow>({
  visible,
  columns,
  model,
  localeText,
  maxFilters,
  onChange,
  onClose,
  filterOperatorsByType,
  filterOperatorsByField,
}: FilterPanelModalProps<TRow>) {
  const [activeSelector, setActiveSelector] = useState<SelectorState>(null);
  const [draftModel, setDraftModel] = useState<FilterModel>({
    items: [],
    logicOperator: 'and',
  });
  const lastSyncedModelRef = useRef<FilterModel | null>(null);
  const keyboardInset = useKeyboardInset(visible);

  const resolvedMaxFilters = Math.max(1, maxFilters);
  const filterableColumns = useMemo(
    () =>
      columns.filter(
        (column) => !isActionColumn(column) && column.filterable !== false
      ),
    [columns]
  );

  const defaultOperatorsByType = useMemo(
    () => getDefaultFilterOperatorsByType<TRow>(),
    []
  );

  const getOperatorsForColumn = useCallback(
    (column: ColumnDef<TRow>) => {
      if (column.filterOperators?.length) {
        return column.filterOperators;
      }

      const byField = filterOperatorsByField?.[column.field];
      if (byField?.length) {
        return byField;
      }

      const columnType = column.type ?? 'string';
      const byType = filterOperatorsByType?.[columnType];
      if (byType?.length) {
        return byType;
      }

      return defaultOperatorsByType[columnType];
    },
    [defaultOperatorsByType, filterOperatorsByField, filterOperatorsByType]
  );

  const defaultColumn = filterableColumns[0];
  const createDraftItem = useCallback((): FilterItem | null => {
    if (!defaultColumn) {
      return null;
    }

    const defaultOperator = getOperatorsForColumn(defaultColumn)[0];
    if (!defaultOperator) {
      return null;
    }

    return {
      id: createFilterId(),
      field: defaultColumn.field,
      operator: defaultOperator.value,
      value:
        defaultOperator.requiresValue === false
          ? undefined
          : defaultOperator.inputType === 'boolean'
          ? true
          : '',
    };
  }, [defaultColumn, getOperatorsForColumn]);

  useEffect(() => {
    if (!visible) {
      lastSyncedModelRef.current = null;
      setActiveSelector((previous) => (previous === null ? previous : null));
      return;
    }

    const nextItems: FilterItem[] =
      model.items.length > 0
        ? model.items.slice(0, resolvedMaxFilters).map((item, index) => ({
            ...item,
            id: item.id ?? getStableExternalFilterId(index),
          }))
        : [];

    if (!nextItems.length) {
      const fallbackItem = createDraftItem();
      if (fallbackItem) {
        nextItems.push(fallbackItem);
      }
    }

    const nextDraftModel: FilterModel = {
      items: nextItems,
      logicOperator: model.logicOperator ?? 'and',
    };

    if (
      lastSyncedModelRef.current &&
      areFilterModelsEqual(lastSyncedModelRef.current, nextDraftModel)
    ) {
      return;
    }

    lastSyncedModelRef.current = nextDraftModel;
    setActiveSelector((previous) => (previous === null ? previous : null));
    setDraftModel(nextDraftModel);
  }, [
    createDraftItem,
    model.items,
    model.logicOperator,
    resolvedMaxFilters,
    visible,
  ]);

  const updateDraftItem = useCallback(
    (itemId: string, patch: Partial<FilterItem>) => {
      setDraftModel((previous) => ({
        ...previous,
        items: previous.items.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        ),
      }));
    },
    []
  );

  const handleSelectField = useCallback(
    (itemId: string, columnField: string) => {
      const nextColumn = filterableColumns.find(
        (column) => column.field === columnField
      );
      if (!nextColumn) {
        return;
      }

      const nextOperator = getOperatorsForColumn(nextColumn)[0];
      updateDraftItem(itemId, {
        field: nextColumn.field,
        operator: nextOperator?.value ?? '',
        value:
          nextOperator?.requiresValue === false
            ? undefined
            : nextOperator?.inputType === 'boolean'
            ? true
            : '',
      });
      setActiveSelector(null);
    },
    [filterableColumns, getOperatorsForColumn, updateDraftItem]
  );

  const handleSelectOperator = useCallback(
    (itemId: string, operator: FilterOperator<TRow>) => {
      setDraftModel((previous) => ({
        ...previous,
        items: previous.items.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          const currentBooleanValue = toBoolean(item.value);
          return {
            ...item,
            operator: operator.value,
            value:
              operator.requiresValue === false
                ? undefined
                : operator.inputType === 'boolean'
                ? currentBooleanValue ?? true
                : typeof item.value === 'boolean'
                ? ''
                : item.value ?? '',
          };
        }),
      }));
      setActiveSelector(null);
    },
    []
  );

  const handleSelectBooleanValue = useCallback(
    (itemId: string, value: boolean) => {
      updateDraftItem(itemId, { value });
      setActiveSelector(null);
    },
    [updateDraftItem]
  );

  const handleAddFilter = useCallback(() => {
    if (draftModel.items.length >= resolvedMaxFilters) {
      return;
    }

    const nextItem = createDraftItem();
    if (!nextItem) {
      return;
    }

    setDraftModel((previous) => ({
      ...previous,
      items: [...previous.items, nextItem],
    }));
  }, [createDraftItem, draftModel.items.length, resolvedMaxFilters]);

  const handleRemoveFilter = useCallback(
    (itemId: string) => {
      setDraftModel((previous) => {
        if (previous.items.length <= 1) {
          const fallbackItem = createDraftItem();
          return {
            ...previous,
            items: fallbackItem ? [fallbackItem] : [],
          };
        }

        return {
          ...previous,
          items: previous.items.filter((item) => item.id !== itemId),
        };
      });
    },
    [createDraftItem]
  );

  const sanitizeDraftModel = useCallback((): FilterModel => {
    const sanitizedItems = draftModel.items
      .slice(0, resolvedMaxFilters)
      .filter((item) => Boolean(item.field) && Boolean(item.operator))
      .map((item) => {
        const column = filterableColumns.find(
          (candidate) => candidate.field === item.field
        );
        if (!column) {
          return null;
        }

        const operator = getOperatorsForColumn(column).find(
          (candidate) =>
            candidate.value === item.operator ||
            candidate.aliases?.includes(item.operator) === true
        );
        if (!operator) {
          return null;
        }

        if (operator.requiresValue === false) {
          return {
            ...item,
            operator: operator.value,
            value: undefined,
          };
        }

        if (isEmptyValue(item.value)) {
          return null;
        }

        return {
          ...item,
          operator: operator.value,
        };
      })
      .filter((item): item is FilterItem => item !== null);

    return {
      items: sanitizedItems,
      logicOperator: draftModel.logicOperator ?? 'and',
    };
  }, [
    draftModel.items,
    draftModel.logicOperator,
    filterableColumns,
    getOperatorsForColumn,
    resolvedMaxFilters,
  ]);

  const handleDone = useCallback(() => {
    const nextModel = sanitizeDraftModel();
    lastSyncedModelRef.current = nextModel;
    onChange(nextModel);
    onClose();
  }, [onChange, onClose, sanitizeDraftModel]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const selectorOptions = useMemo(() => {
    if (!activeSelector) {
      return [];
    }

    const activeItem = draftModel.items.find(
      (item) => item.id === activeSelector.itemId
    );
    if (!activeItem) {
      return [];
    }

    if (activeSelector.type === 'field') {
      return filterableColumns.map((column) => ({
        key: column.field,
        label: column.headerName,
        onPress: () => handleSelectField(activeSelector.itemId, column.field),
      }));
    }

    if (activeSelector.type === 'operator') {
      const activeColumn =
        filterableColumns.find((column) => column.field === activeItem.field) ??
        defaultColumn;
      if (!activeColumn) {
        return [];
      }

      return getOperatorsForColumn(activeColumn).map((operator) => ({
        key: operator.value,
        label: localeText.operatorLabels[operator.value] ?? operator.label,
        onPress: () => handleSelectOperator(activeSelector.itemId, operator),
      }));
    }

    return [
      {
        key: 'true',
        label: localeText.booleanTrueLabel,
        onPress: () => handleSelectBooleanValue(activeSelector.itemId, true),
      },
      {
        key: 'false',
        label: localeText.booleanFalseLabel,
        onPress: () => handleSelectBooleanValue(activeSelector.itemId, false),
      },
    ];
  }, [
    activeSelector,
    defaultColumn,
    draftModel.items,
    filterableColumns,
    getOperatorsForColumn,
    handleSelectBooleanValue,
    handleSelectField,
    handleSelectOperator,
    localeText.booleanFalseLabel,
    localeText.booleanTrueLabel,
    localeText.operatorLabels,
  ]);

  if (!filterableColumns.length || !defaultColumn) {
    return null;
  }

  return (
    <>
      <Modal
        animationType="slide"
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <SafeAreaView
            style={[styles.safeArea, { paddingBottom: keyboardInset }]}
          >
            <View style={styles.keyboardContainer}>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Pressable onPress={handleCancel} style={styles.headerButton}>
                    <Text style={styles.cancelLabel}>{localeText.cancel}</Text>
                  </Pressable>
                  <Text numberOfLines={1} style={styles.title}>
                    {localeText.filtersTitle}
                  </Text>

                  <View style={styles.headerActions}>
                    {resolvedMaxFilters > 1 ? (
                      <Pressable
                        accessibilityLabel={localeText.addFilter}
                        disabled={draftModel.items.length >= resolvedMaxFilters}
                        onPress={handleAddFilter}
                        style={[
                          styles.headerIconButton,
                          draftModel.items.length >= resolvedMaxFilters &&
                            styles.headerIconButtonDisabled,
                        ]}
                      >
                        <PlusIcon color="#4B5563" />
                      </Pressable>
                    ) : null}

                    <Pressable
                      onPress={handleDone}
                      style={styles.confirmButton}
                    >
                      <Text style={styles.doneLabel}>
                        {localeText.searchApply}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {resolvedMaxFilters > 1 && draftModel.items.length > 1 ? (
                  <View style={styles.logicRow}>
                    <Pressable
                      onPress={() =>
                        setDraftModel((previous) => ({
                          ...previous,
                          logicOperator: 'and',
                        }))
                      }
                      style={[
                        styles.logicChip,
                        draftModel.logicOperator !== 'or' &&
                          styles.logicChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.logicChipLabel,
                          draftModel.logicOperator !== 'or' &&
                            styles.logicChipLabelActive,
                        ]}
                      >
                        {localeText.logicAnd}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setDraftModel((previous) => ({
                          ...previous,
                          logicOperator: 'or',
                        }))
                      }
                      style={[
                        styles.logicChip,
                        draftModel.logicOperator === 'or' &&
                          styles.logicChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.logicChipLabel,
                          draftModel.logicOperator === 'or' &&
                            styles.logicChipLabelActive,
                        ]}
                      >
                        {localeText.logicOr}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <ScrollView
                  contentContainerStyle={styles.filtersContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {draftModel.items.map((item) => {
                    const currentColumn =
                      filterableColumns.find(
                        (column) => column.field === item.field
                      ) ?? defaultColumn;
                    const availableOperators =
                      getOperatorsForColumn(currentColumn);
                    const currentOperator =
                      availableOperators.find(
                        (operator) =>
                          operator.value === item.operator ||
                          operator.aliases?.includes(item.operator) === true
                      ) ?? availableOperators[0];

                    const operatorLabel =
                      localeText.operatorLabels[currentOperator?.value ?? ''] ??
                      currentOperator?.label ??
                      '';

                    const requiresValue =
                      currentOperator?.requiresValue !== false;
                    const inputType =
                      currentOperator?.inputType ?? currentColumn.type;
                    const isBooleanValue = inputType === 'boolean';

                    return (
                      <View key={item.id} style={styles.filterCard}>
                        <View style={styles.filterRow}>
                          <View style={styles.fieldWrapper}>
                            <SelectField
                              label={localeText.fieldLabel}
                              value={currentColumn.headerName}
                              onPress={() =>
                                setActiveSelector({
                                  itemId: item.id ?? createFilterId(),
                                  type: 'field',
                                })
                              }
                            />
                          </View>

                          <View style={styles.fieldWrapper}>
                            <SelectField
                              label={localeText.operatorLabel}
                              value={operatorLabel}
                              onPress={() =>
                                setActiveSelector({
                                  itemId: item.id ?? createFilterId(),
                                  type: 'operator',
                                })
                              }
                            />
                          </View>

                          {isBooleanValue ? (
                            <View style={styles.valueWrapper}>
                              <SelectField
                                disabled={!requiresValue}
                                label={localeText.valueLabel}
                                value={
                                  toBoolean(item.value) === false
                                    ? localeText.booleanFalseLabel
                                    : localeText.booleanTrueLabel
                                }
                                onPress={() =>
                                  setActiveSelector({
                                    itemId: item.id ?? createFilterId(),
                                    type: 'booleanValue',
                                  })
                                }
                              />
                            </View>
                          ) : (
                            <View style={styles.valueField}>
                              <Text style={styles.selectLabel}>
                                {localeText.valueLabel}
                              </Text>
                              <TextInput
                                editable={requiresValue}
                                keyboardType={
                                  currentColumn.type === 'number'
                                    ? 'numeric'
                                    : 'default'
                                }
                                onChangeText={(text) =>
                                  updateDraftItem(item.id ?? '', {
                                    value: text,
                                  })
                                }
                                placeholder={localeText.valuePlaceholder}
                                style={[
                                  styles.valueInput,
                                  !requiresValue && styles.valueInputDisabled,
                                ]}
                                value={
                                  requiresValue ? String(item.value ?? '') : ''
                                }
                              />
                            </View>
                          )}

                          <View style={styles.actionField}>
                            <Pressable
                              accessibilityLabel={localeText.removeFilter}
                              hitSlop={10}
                              onPress={() => handleRemoveFilter(item.id ?? '')}
                              style={styles.clearFilterButton}
                            >
                              <TrashIcon />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible={activeSelector !== null}
        onRequestClose={() => setActiveSelector(null)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setActiveSelector(null)}
          />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.selectorSheet}>
              <View style={styles.header}>
                <Pressable
                  onPress={() => setActiveSelector(null)}
                  style={styles.headerButton}
                >
                  <Text style={styles.cancelLabel}>{localeText.cancel}</Text>
                </Pressable>
                <Text numberOfLines={1} style={styles.title}>
                  {activeSelector?.type === 'field'
                    ? localeText.fieldLabel
                    : activeSelector?.type === 'operator'
                    ? localeText.operatorLabel
                    : localeText.valueLabel}
                </Text>
                <Pressable
                  onPress={() => setActiveSelector(null)}
                  style={styles.headerButton}
                >
                  <Text style={styles.doneLabel}>{localeText.searchApply}</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.selectorList}>
                {selectorOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={option.onPress}
                    style={styles.selectorItem}
                  >
                    <Text style={styles.selectorItemText}>{option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

export const FilterPanelModal = React.memo(
  FilterPanelModalComponent
) as typeof FilterPanelModalComponent;

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(17, 24, 39, 0.26)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  safeArea: {
    justifyContent: 'flex-end',
    maxHeight: '82%',
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    minHeight: 220,
    padding: 16,
  },
  selectorSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '85%',
    minHeight: 240,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 40,
  },
  headerButton: {
    justifyContent: 'center',
    minWidth: 72,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    minWidth: 108,
  },
  confirmButton: {
    justifyContent: 'center',
  },
  cancelLabel: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#111827',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  doneLabel: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '700',
  },
  headerIconButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerIconButtonDisabled: {
    opacity: 0.35,
  },
  logicRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  logicChip: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logicChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  logicChipLabel: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
  logicChipLabelActive: {
    color: '#1D4ED8',
  },
  filtersContent: {
    gap: 10,
    paddingBottom: 0,
  },
  filterCard: {},
  filterRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
  },
  fieldWrapper: {
    flex: 1,
    minWidth: 0,
  },
  valueWrapper: {
    flex: 1,
    minWidth: 0,
  },
  selectField: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectFieldDisabled: {
    backgroundColor: '#F9FAFB',
  },
  selectLabel: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 4,
  },
  selectValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectValue: {
    color: '#111827',
    flex: 1,
    fontSize: 16,
    marginRight: 6,
  },
  valueField: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    minHeight: 62,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  actionField: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 62,
    width: 44,
  },
  valueInput: {
    color: '#111827',
    fontSize: 16,
    paddingVertical: 0,
  },
  valueInputDisabled: {
    color: '#9CA3AF',
  },
  clearFilterButton: {
    alignItems: 'center',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  selectorList: {
    maxHeight: 320,
  },
  selectorItem: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  selectorItemText: {
    color: '#111827',
    fontSize: 16,
  },
});
