import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
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

import type {
  ColumnDef,
  ColumnVisibilityModel,
  DataGridLocaleText,
} from '../types';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { areColumnVisibilityModelsEqual } from '../utils/stateComparison';

interface ColumnMenuModalProps<TRow> {
  visible: boolean;
  columns: ColumnDef<TRow>[];
  model: ColumnVisibilityModel;
  localeText: DataGridLocaleText;
  onChange: (next: ColumnVisibilityModel) => void;
  onClose: () => void;
}

function ColumnMenuModalComponent<TRow>({
  visible,
  columns,
  model,
  localeText,
  onChange,
  onClose,
}: ColumnMenuModalProps<TRow>) {
  const [searchText, setSearchText] = useState('');
  const [draftModel, setDraftModel] = useState<ColumnVisibilityModel>(model);
  const keyboardInset = useKeyboardInset(visible);

  useEffect(() => {
    if (!visible) {
      setSearchText((previous) => (previous === '' ? previous : ''));
      setDraftModel((previous) =>
        areColumnVisibilityModelsEqual(previous, model) ? previous : model
      );
      return;
    }

    setDraftModel((previous) =>
      areColumnVisibilityModelsEqual(previous, model) ? previous : model
    );
  }, [model, visible]);

  const handleClose = () => {
    setSearchText((previous) => (previous === '' ? previous : ''));
    setDraftModel((previous) =>
      areColumnVisibilityModelsEqual(previous, model) ? previous : model
    );
    onClose();
  };

  const handleApply = () => {
    if (!areColumnVisibilityModelsEqual(draftModel, model)) {
      onChange(draftModel);
    }
    setSearchText((previous) => (previous === '' ? previous : ''));
    onClose();
  };

  const hideableColumns = useMemo(
    () => columns.filter((column) => column.hideable !== false),
    [columns]
  );

  const filteredColumns = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) {
      return hideableColumns;
    }

    return hideableColumns.filter((column) => {
      const searchable = `${column.headerName} ${column.field}`.toLowerCase();
      return searchable.includes(normalized);
    });
  }, [hideableColumns, searchText]);

  const allVisible = hideableColumns.every(
    (column) => draftModel[column.field] !== false
  );

  const toggleField = (field: string) => {
    setDraftModel((previous) => ({
      ...previous,
      [field]: previous[field] === false,
    }));
  };

  const showAll = () => {
    const next = { ...draftModel };
    for (const column of hideableColumns) {
      next[column.field] = true;
    }
    setDraftModel(next);
  };

  const hideAll = () => {
    const next = { ...draftModel };
    for (const column of hideableColumns) {
      next[column.field] = false;
    }
    setDraftModel(next);
  };

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <SafeAreaView
          style={[styles.safeArea, { paddingBottom: keyboardInset }]}
        >
          <View style={styles.keyboardContainer}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Pressable onPress={handleClose} style={styles.headerButton}>
                  <Text style={styles.cancel}>{localeText.cancel}</Text>
                </Pressable>
                <Text numberOfLines={1} style={styles.title}>
                  {localeText.columnsTitle}
                </Text>
                <Pressable onPress={handleApply} style={styles.headerButton}>
                  <Text style={styles.close}>{localeText.searchApply}</Text>
                </Pressable>
              </View>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setSearchText}
                placeholder={localeText.searchColumnsPlaceholder}
                style={styles.input}
                value={searchText}
              />

              <View style={styles.actions}>
                <Pressable
                  hitSlop={6}
                  onPress={showAll}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionLabel}>{localeText.showAll}</Text>
                </Pressable>
                <Pressable
                  hitSlop={6}
                  onPress={hideAll}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionLabel}>{localeText.hideAll}</Text>
                </Pressable>
              </View>

              <View style={styles.listContainer}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                  style={styles.list}
                >
                  <View style={styles.listContent}>
                    {filteredColumns.map((column) => {
                      const visibleState = draftModel[column.field] !== false;
                      return (
                        <Pressable
                          key={column.field}
                          hitSlop={8}
                          onPress={() => toggleField(column.field)}
                          style={styles.listItem}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              visibleState && styles.checkboxSelected,
                            ]}
                          >
                            {visibleState ? (
                              <MaterialIcons
                                color="#FFFFFF"
                                name="check"
                                size={14}
                              />
                            ) : null}
                          </View>
                          <Text style={styles.listLabel}>
                            {column.headerName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <Text style={styles.summary}>
                {allVisible
                  ? localeText.allColumnsVisible
                  : localeText.someColumnsHidden}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export const ColumnMenuModal = React.memo(
  ColumnMenuModalComponent
) as typeof ColumnMenuModalComponent;

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  safeArea: {
    justifyContent: 'flex-end',
    maxHeight: '76%',
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
    maxHeight: '100%',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '100%',
    minHeight: 320,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 40,
  },
  headerButton: {
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  cancel: {
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
  close: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  input: {
    borderColor: '#D1D5DB',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    minHeight: 40,
  },
  actionButton: {
    justifyContent: 'center',
    minHeight: 36,
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actionLabel: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 12,
    maxHeight: 320,
    minHeight: 0,
  },
  list: {
    flexGrow: 0,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 4,
  },
  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingVertical: 10,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#9CA3AF',
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    height: 20,
    width: 20,
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  listLabel: {
    color: '#111827',
    fontSize: 16,
  },
  summary: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 10,
  },
});
