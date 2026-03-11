import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export const LoadingOverlay = React.memo(function LoadingOverlay() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <ActivityIndicator size="small" color="#2563EB" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
  },
});
