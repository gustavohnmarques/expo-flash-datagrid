import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFilterOperatorsForColumn } from '../utils/filtering';
import {
  areColumnValuesEqual,
  findFilterSelectOption,
  toValueArray,
} from '../utils/columnValues';
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
  type: 'field' | 'operator' | 'booleanValue' | 'selectValue';
} | null;

type SelectorOption = {
  key: string;
  label: string;
  onPress: () => void;
  meta?: string;
  selected?: boolean;
};

type DateInputType = 'date' | 'datetime';

type DatePickerState = {
  itemId: string;
  inputType: DateInputType;
  value: Date;
};

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

function matchesOperatorValue<TRow>(
  operator: FilterOperator<TRow>,
  value: string
): boolean {
  return operator.value === value || operator.aliases?.includes(value) === true;
}

function resolvePreferredOperator<TRow>(
  column: ColumnDef<TRow>,
  operators: FilterOperator<TRow>[]
): FilterOperator<TRow> | undefined {
  if (column.filterForceOperator) {
    return operators.find((operator) =>
      matchesOperatorValue(operator, column.filterForceOperator ?? '')
    );
  }

  return operators[0];
}

function supportsMultipleSelect<TRow>(
  column: ColumnDef<TRow>,
  operator?: FilterOperator<TRow>
): boolean {
  if (!column.filterSelectOptions?.length) {
    return false;
  }

  if (column.filterSelectMultiple !== undefined) {
    return column.filterSelectMultiple;
  }

  return operator?.inputType === 'multi';
}

function getDefaultFilterValue<TRow>(
  column: ColumnDef<TRow>,
  operator: FilterOperator<TRow> | undefined,
  previousValue?: unknown
): unknown {
  if (!operator || operator.requiresValue === false) {
    return undefined;
  }

  if (operator.inputType === 'boolean') {
    return toBoolean(previousValue) ?? true;
  }

  if (column.filterSelectOptions?.length) {
    const values = toValueArray(previousValue);

    if (supportsMultipleSelect(column, operator)) {
      return values;
    }

    return values[0] ?? '';
  }

  if (Array.isArray(previousValue) || typeof previousValue === 'boolean') {
    return '';
  }

  return previousValue ?? '';
}

function getValuePlaceholder(
  inputType: FilterOperator['inputType'] | ColumnDef<unknown>['type'],
  localeText: DataGridLocaleText
): string {
  if (inputType === 'date') {
    return 'DD/MM/YYYY';
  }

  if (inputType === 'datetime') {
    return 'DD/MM/YYYY HH:mm';
  }

  if (inputType === 'number') {
    return '0';
  }

  return localeText.valuePlaceholder;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function isDateInputType(value: unknown): value is DateInputType {
  return value === 'date' || value === 'datetime';
}

function serializePickerValue(date: Date, inputType: DateInputType): string {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  if (inputType === 'date') {
    return `${year}-${month}-${day}`;
  }

  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

function buildLocalDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0
): Date | null {
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds);

  const isValid =
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day &&
    parsed.getHours() === hours &&
    parsed.getMinutes() === minutes &&
    parsed.getSeconds() === seconds;

  return isValid ? parsed : null;
}

function parsePickerValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = value.trim();
  const localizedMatch = normalized.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (localizedMatch) {
    const [, day, month, year, hours, minutes, seconds] = localizedMatch;
    return buildLocalDate(
      Number(year),
      Number(month),
      Number(day),
      Number(hours ?? 0),
      Number(minutes ?? 0),
      Number(seconds ?? 0)
    );
  }

  const isoLocalMatch = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (isoLocalMatch) {
    const [, year, month, day, hours, minutes, seconds] = isoLocalMatch;
    return buildLocalDate(
      Number(year),
      Number(month),
      Number(day),
      Number(hours ?? 0),
      Number(minutes ?? 0),
      Number(seconds ?? 0)
    );
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPickerDisplayValue(
  value: unknown,
  inputType: DateInputType,
  localeText: DataGridLocaleText
): string {
  const parsed = parsePickerValue(value);
  if (!parsed) {
    return getValuePlaceholder(inputType, localeText);
  }

  const day = padDatePart(parsed.getDate());
  const month = padDatePart(parsed.getMonth() + 1);
  const year = parsed.getFullYear();

  if (inputType === 'date') {
    return `${day}/${month}/${year}`;
  }

  const hours = padDatePart(parsed.getHours());
  const minutes = padDatePart(parsed.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function mergeDateAndTime(dateValue: Date, timeValue: Date): Date {
  const merged = new Date(dateValue.getTime());
  merged.setHours(
    timeValue.getHours(),
    timeValue.getMinutes(),
    timeValue.getSeconds(),
    0
  );
  return merged;
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
  const [activeDatePicker, setActiveDatePicker] =
    useState<DatePickerState | null>(null);
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

  const getOperatorsForColumn = useCallback(
    (column: ColumnDef<TRow>) =>
      getFilterOperatorsForColumn(column, {
        filterOperatorsByField,
        filterOperatorsByType,
      }),
    [filterOperatorsByField, filterOperatorsByType]
  );

  const defaultColumn = filterableColumns[0];
  const createDraftItem = useCallback((): FilterItem | null => {
    if (!defaultColumn) {
      return null;
    }

    const defaultOperator = resolvePreferredOperator(
      defaultColumn,
      getOperatorsForColumn(defaultColumn)
    );
    if (!defaultOperator) {
      return null;
    }

    return {
      id: createFilterId(),
      field: defaultColumn.field,
      operator: defaultOperator.value,
      value: getDefaultFilterValue(defaultColumn, defaultOperator),
    };
  }, [defaultColumn, getOperatorsForColumn]);

  useEffect(() => {
    if (!visible) {
      lastSyncedModelRef.current = null;
      setActiveSelector((previous) => (previous === null ? previous : null));
      setActiveDatePicker((previous) => (previous === null ? previous : null));
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

  const commitDateValue = useCallback(
    (itemId: string, inputType: DateInputType, date: Date) => {
      updateDraftItem(itemId, {
        value: serializePickerValue(date, inputType),
      });
    },
    [updateDraftItem]
  );

  const openAndroidDatePicker = useCallback(
    (itemId: string, inputType: DateInputType, initialValue: Date) => {
      const openTimePicker = (selectedDate: Date) => {
        DateTimePickerAndroid.open({
          is24Hour: true,
          mode: 'time',
          value: selectedDate,
          onChange: (event, selectedTime) => {
            if (event.type !== 'set' || !selectedTime) {
              return;
            }

            commitDateValue(
              itemId,
              inputType,
              mergeDateAndTime(selectedDate, selectedTime)
            );
          },
        });
      };

      DateTimePickerAndroid.open({
        is24Hour: true,
        mode: 'date',
        value: initialValue,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) {
            return;
          }

          if (inputType === 'datetime') {
            openTimePicker(selectedDate);
            return;
          }

          commitDateValue(itemId, inputType, selectedDate);
        },
      });
    },
    [commitDateValue]
  );

  const handleOpenDatePicker = useCallback(
    (itemId: string, inputType: DateInputType, currentValue: unknown) => {
      const parsedValue = parsePickerValue(currentValue) ?? new Date();

      if (Platform.OS === 'android') {
        openAndroidDatePicker(itemId, inputType, parsedValue);
        return;
      }

      setActiveDatePicker({
        itemId,
        inputType,
        value: parsedValue,
      });
    },
    [openAndroidDatePicker]
  );

  const handleDatePickerChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!selectedDate) {
        return;
      }

      setActiveDatePicker((previous) =>
        previous ? { ...previous, value: selectedDate } : previous
      );
    },
    []
  );

  const handleConfirmDatePicker = useCallback(() => {
    if (!activeDatePicker) {
      return;
    }

    commitDateValue(
      activeDatePicker.itemId,
      activeDatePicker.inputType,
      activeDatePicker.value
    );
    setActiveDatePicker(null);
  }, [activeDatePicker, commitDateValue]);

  const handleSelectField = useCallback(
    (itemId: string, columnField: string) => {
      const nextColumn = filterableColumns.find(
        (column) => column.field === columnField
      );
      if (!nextColumn) {
        return;
      }

      const nextOperator = resolvePreferredOperator(
        nextColumn,
        getOperatorsForColumn(nextColumn)
      );
      updateDraftItem(itemId, {
        field: nextColumn.field,
        operator: nextOperator?.value ?? '',
        value: getDefaultFilterValue(nextColumn, nextOperator),
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

          const currentColumn =
            filterableColumns.find((column) => column.field === item.field) ??
            defaultColumn;
          if (!currentColumn) {
            return item;
          }

          return {
            ...item,
            operator: operator.value,
            value: getDefaultFilterValue(currentColumn, operator, item.value),
          };
        }),
      }));
      setActiveSelector(null);
    },
    [defaultColumn, filterableColumns]
  );

  const handleSelectBooleanValue = useCallback(
    (itemId: string, value: boolean) => {
      updateDraftItem(itemId, { value });
      setActiveSelector(null);
    },
    [updateDraftItem]
  );

  const handleSelectFilterValue = useCallback(
    (itemId: string, optionValue: unknown) => {
      setDraftModel((previous) => ({
        ...previous,
        items: previous.items.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          const currentColumn =
            filterableColumns.find((column) => column.field === item.field) ??
            defaultColumn;
          if (!currentColumn) {
            return item;
          }

          const currentOperator =
            getOperatorsForColumn(currentColumn).find((operator) =>
              matchesOperatorValue(operator, item.operator)
            ) ??
            resolvePreferredOperator(
              currentColumn,
              getOperatorsForColumn(currentColumn)
            );

          if (supportsMultipleSelect(currentColumn, currentOperator)) {
            const currentValues = toValueArray(item.value);
            const isSelected = currentValues.some((value) =>
              areColumnValuesEqual(value, optionValue)
            );
            const nextValues = isSelected
              ? currentValues.filter(
                  (value) => !areColumnValuesEqual(value, optionValue)
                )
              : [...currentValues, optionValue];

            return {
              ...item,
              value: nextValues,
            };
          }

          return {
            ...item,
            value: optionValue,
          };
        }),
      }));

      const currentItem = draftModel.items.find((item) => item.id === itemId);
      const currentColumn =
        filterableColumns.find(
          (column) => column.field === currentItem?.field
        ) ?? defaultColumn;
      if (!currentColumn) {
        return;
      }

      const currentOperator =
        getOperatorsForColumn(currentColumn).find((operator) =>
          currentItem
            ? matchesOperatorValue(operator, currentItem.operator)
            : false
        ) ??
        resolvePreferredOperator(
          currentColumn,
          getOperatorsForColumn(currentColumn)
        );

      if (!supportsMultipleSelect(currentColumn, currentOperator)) {
        setActiveSelector(null);
      }
    },
    [defaultColumn, draftModel.items, filterableColumns, getOperatorsForColumn]
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
    const sanitizedItems: FilterItem[] = [];

    draftModel.items
      .slice(0, resolvedMaxFilters)
      .filter((item) => Boolean(item.field) && Boolean(item.operator))
      .forEach((item) => {
        const column = filterableColumns.find(
          (candidate) => candidate.field === item.field
        );
        if (!column) {
          return;
        }

        const operator =
          getOperatorsForColumn(column).find((candidate) =>
            matchesOperatorValue(
              candidate,
              column.filterForceOperator ?? item.operator
            )
          ) ?? resolvePreferredOperator(column, getOperatorsForColumn(column));
        if (!operator) {
          return;
        }

        if (operator.requiresValue === false) {
          sanitizedItems.push({
            ...item,
            operator: operator.value,
            value: undefined,
          });
          return;
        }

        if (isEmptyValue(item.value)) {
          return;
        }

        sanitizedItems.push({
          ...item,
          operator: operator.value,
          value:
            column.filterSelectOptions?.length &&
            supportsMultipleSelect(column, operator)
              ? toValueArray(item.value)
              : item.value,
        });
      });

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

  const selectorOptions = useMemo<SelectorOption[]>(() => {
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

    if (activeSelector.type === 'selectValue') {
      const activeColumn =
        filterableColumns.find((column) => column.field === activeItem.field) ??
        defaultColumn;
      if (!activeColumn?.filterSelectOptions?.length) {
        return [];
      }

      const selectedValues = toValueArray(activeItem.value);

      return activeColumn.filterSelectOptions.map((option) => ({
        key: String(option.value),
        label: option.label,
        selected: selectedValues.some((value) =>
          areColumnValuesEqual(value, option.value)
        ),
        onPress: () =>
          handleSelectFilterValue(activeSelector.itemId, option.value),
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
    handleSelectFilterValue,
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
                      availableOperators.find((operator) =>
                        matchesOperatorValue(
                          operator,
                          currentColumn.filterForceOperator ?? item.operator
                        )
                      ) ??
                      resolvePreferredOperator(
                        currentColumn,
                        availableOperators
                      );

                    const operatorLabel =
                      localeText.operatorLabels[currentOperator?.value ?? ''] ??
                      currentOperator?.label ??
                      '';

                    const requiresValue =
                      currentOperator?.requiresValue !== false;
                    const inputType =
                      currentOperator?.inputType ?? currentColumn.type;
                    const isDateValue = isDateInputType(inputType);
                    const isBooleanValue = inputType === 'boolean';
                    const isSelectValue =
                      Boolean(currentColumn.filterSelectOptions?.length) &&
                      !isBooleanValue &&
                      !isDateValue;
                    const selectedOptionLabels = toValueArray(item.value).map(
                      (value) =>
                        findFilterSelectOption(
                          currentColumn.filterSelectOptions,
                          value
                        )?.label ?? String(value)
                    );
                    const selectValueLabel = selectedOptionLabels.length
                      ? selectedOptionLabels.join(', ')
                      : localeText.valuePlaceholder;
                    const dateValueLabel = isDateValue
                      ? formatPickerDisplayValue(
                          item.value,
                          inputType,
                          localeText
                        )
                      : '';
                    const shouldHideOperator = currentColumn.filterHideOperator;

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

                          {!shouldHideOperator ? (
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
                          ) : null}

                          {requiresValue && isBooleanValue ? (
                            <View style={styles.valueWrapper}>
                              <SelectField
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
                          ) : requiresValue && isDateValue ? (
                            <View style={styles.valueWrapper}>
                              <SelectField
                                label={localeText.valueLabel}
                                value={dateValueLabel}
                                onPress={() =>
                                  handleOpenDatePicker(
                                    item.id ?? '',
                                    inputType,
                                    item.value
                                  )
                                }
                              />
                            </View>
                          ) : requiresValue && isSelectValue ? (
                            <View style={styles.valueWrapper}>
                              <SelectField
                                label={localeText.valueLabel}
                                value={selectValueLabel}
                                onPress={() =>
                                  setActiveSelector({
                                    itemId: item.id ?? createFilterId(),
                                    type: 'selectValue',
                                  })
                                }
                              />
                            </View>
                          ) : requiresValue ? (
                            <View style={styles.valueField}>
                              <Text style={styles.selectLabel}>
                                {localeText.valueLabel}
                              </Text>
                              <TextInput
                                keyboardType={
                                  inputType === 'number' ? 'numeric' : 'default'
                                }
                                onChangeText={(text) =>
                                  updateDraftItem(item.id ?? '', {
                                    value: text,
                                  })
                                }
                                placeholder={getValuePlaceholder(
                                  inputType,
                                  localeText
                                )}
                                style={styles.valueInput}
                                value={String(item.value ?? '')}
                              />
                            </View>
                          ) : null}

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
                    style={[
                      styles.selectorItem,
                      option.selected && styles.selectorItemSelected,
                    ]}
                  >
                    <View style={styles.selectorItemRow}>
                      <Text style={styles.selectorItemText}>
                        {option.label}
                      </Text>
                      {option.meta ? (
                        <Text style={styles.selectorItemMeta}>
                          {option.meta}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
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
        visible={Platform.OS === 'ios' && activeDatePicker !== null}
        onRequestClose={() => setActiveDatePicker(null)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setActiveDatePicker(null)}
          />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.pickerSheet}>
              <View style={styles.header}>
                <Pressable
                  onPress={() => setActiveDatePicker(null)}
                  style={styles.headerButton}
                >
                  <Text style={styles.cancelLabel}>{localeText.cancel}</Text>
                </Pressable>
                <Text numberOfLines={1} style={styles.title}>
                  {localeText.valueLabel}
                </Text>
                <Pressable
                  onPress={handleConfirmDatePicker}
                  style={styles.headerButton}
                >
                  <Text style={styles.doneLabel}>{localeText.searchApply}</Text>
                </Pressable>
              </View>

              {activeDatePicker ? (
                <View style={styles.pickerBody}>
                  <DateTimePicker
                    display="spinner"
                    is24Hour
                    mode={
                      activeDatePicker.inputType === 'datetime'
                        ? 'datetime'
                        : 'date'
                    }
                    onChange={handleDatePickerChange}
                    style={styles.datePicker}
                    value={activeDatePicker.value}
                  />
                </View>
              ) : null}
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
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
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
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'transparent',
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
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'transparent',
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
  clearFilterButton: {
    alignItems: 'center',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    width: 44,
    backgroundColor: 'transparent',
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
  selectorItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  selectorItemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorItemText: {
    color: '#111827',
    fontSize: 16,
  },
  selectorItemMeta: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
  },
  pickerBody: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  datePicker: {
    alignSelf: 'stretch',
  },
});
