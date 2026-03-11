import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  label?: string;
}

export const EmptyState = React.memo(function EmptyState({
  label = 'No records found',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  label: {
    color: '#6B7280',
    fontSize: 14,
  },
});
