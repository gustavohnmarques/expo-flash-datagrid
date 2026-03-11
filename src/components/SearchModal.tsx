import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataGridLocaleText } from '../types';
import { useKeyboardInset } from '../hooks/useKeyboardInset';

interface SearchModalProps {
  visible: boolean;
  value: string;
  localeText: DataGridLocaleText;
  onChange: (next: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

export const SearchModal = React.memo(function SearchModal({
  visible,
  value,
  localeText,
  onChange,
  onApply,
  onClear,
  onClose,
}: SearchModalProps) {
  const keyboardInset = useKeyboardInset(visible);

  return (
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
          <View style={styles.sheetContainer}>
            <Pressable style={styles.content} onPress={() => {}}>
              <View style={styles.header}>
                <Pressable onPress={onClose} style={styles.headerButton}>
                  <Text style={styles.cancel}>{localeText.cancel}</Text>
                </Pressable>
                <Text numberOfLines={1} style={styles.title}>
                  {localeText.searchTitle}
                </Text>
                <Pressable onPress={onApply} style={styles.headerButton}>
                  <Text style={styles.apply}>{localeText.searchApply}</Text>
                </Pressable>
              </View>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onChangeText={onChange}
                onSubmitEditing={onApply}
                placeholder={localeText.searchPlaceholder}
                style={styles.input}
                value={value}
              />
              <View style={styles.actions}>
                <Pressable
                  hitSlop={6}
                  onPress={onClear}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.clear}>{localeText.searchClear}</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

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
    maxHeight: '100%',
  },
  sheetContainer: {
    justifyContent: 'flex-end',
  },
  content: {
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
  input: {
    borderColor: '#D1D5DB',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  secondaryAction: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clear: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  apply: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
});
