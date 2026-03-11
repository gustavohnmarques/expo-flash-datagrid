import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  color?: string;
  size?: number;
}

function getChevronMetrics(size: number) {
  const base = Math.max(10, size);
  const side = Math.max(3, Math.round(base * 0.29));
  const point = Math.max(4, Math.round(base * 0.36));

  return {
    left: Math.floor((base - side * 2) / 2),
    point,
    side,
    top: Math.floor((base - point) / 2),
  };
}

function IconFrame({
  children,
  size = 18,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return <View style={{ height: size, width: size }}>{children}</View>;
}

export function GridIcon({ color = '#6B7280', size = 18 }: IconProps) {
  return (
    <IconFrame size={size}>
      <View style={styles.gridRow}>
        <View style={[styles.gridCell, { backgroundColor: color }]} />
        <View style={[styles.gridCell, { backgroundColor: color }]} />
        <View style={[styles.gridCell, { backgroundColor: color }]} />
      </View>
      <View style={[styles.gridRow, styles.gridRowBottom]}>
        <View style={[styles.gridCell, { backgroundColor: color }]} />
        <View style={[styles.gridCell, { backgroundColor: color }]} />
        <View style={[styles.gridCell, { backgroundColor: color }]} />
      </View>
    </IconFrame>
  );
}

export function FilterIcon({ color = '#6B7280', size = 18 }: IconProps) {
  return (
    <IconFrame size={size}>
      <View style={[styles.filterLineTop, { backgroundColor: color }]} />
      <View style={[styles.filterLineMiddle, { backgroundColor: color }]} />
      <View style={[styles.filterLineBottom, { backgroundColor: color }]} />
    </IconFrame>
  );
}

export function DownloadIcon({ color = '#6B7280', size = 18 }: IconProps) {
  return (
    <IconFrame size={size}>
      <View style={[styles.downloadStem, { backgroundColor: color }]} />
      <View
        style={[
          styles.downloadArrow,
          {
            borderTopColor: color,
          },
        ]}
      />
      <View style={[styles.downloadBase, { backgroundColor: color }]} />
    </IconFrame>
  );
}

export function SearchIcon({ color = '#6B7280', size = 18 }: IconProps) {
  return (
    <IconFrame size={size}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View style={[styles.searchHandle, { backgroundColor: color }]} />
    </IconFrame>
  );
}

export function ChevronDownIcon({ color = '#6B7280', size = 14 }: IconProps) {
  const frameSize = Math.max(10, size);
  const metrics = getChevronMetrics(frameSize);
  const chevronStyle = {
    borderLeftColor: 'transparent',
    borderLeftWidth: metrics.side,
    borderRightColor: 'transparent',
    borderRightWidth: metrics.side,
    borderTopColor: color,
    borderTopWidth: metrics.point,
    left: metrics.left,
    position: 'absolute' as const,
    top: metrics.top,
  };

  return (
    <IconFrame size={frameSize}>
      <View style={chevronStyle} />
    </IconFrame>
  );
}

export function ChevronUpIcon({ color = '#6B7280', size = 14 }: IconProps) {
  const frameSize = Math.max(10, size);
  const metrics = getChevronMetrics(frameSize);
  const chevronStyle = {
    borderBottomColor: color,
    borderBottomWidth: metrics.point,
    borderLeftColor: 'transparent',
    borderLeftWidth: metrics.side,
    borderRightColor: 'transparent',
    borderRightWidth: metrics.side,
    left: metrics.left,
    position: 'absolute' as const,
    top: metrics.top,
  };

  return (
    <IconFrame size={frameSize}>
      <View style={chevronStyle} />
    </IconFrame>
  );
}

export function ChevronLeftIcon({ color = '#6B7280', size = 14 }: IconProps) {
  const frameSize = Math.max(10, size);
  const metrics = getChevronMetrics(frameSize);
  const chevronStyle = {
    borderBottomColor: 'transparent',
    borderBottomWidth: metrics.side,
    borderRightColor: color,
    borderRightWidth: metrics.point,
    borderTopColor: 'transparent',
    borderTopWidth: metrics.side,
    left: Math.floor((frameSize - metrics.point) / 2),
    position: 'absolute' as const,
    top: Math.floor((frameSize - metrics.side * 2) / 2),
  };

  return (
    <IconFrame size={frameSize}>
      <View style={chevronStyle} />
    </IconFrame>
  );
}

export function ChevronRightIcon({ color = '#6B7280', size = 14 }: IconProps) {
  const frameSize = Math.max(10, size);
  const metrics = getChevronMetrics(frameSize);
  const chevronStyle = {
    borderBottomColor: 'transparent',
    borderBottomWidth: metrics.side,
    borderLeftColor: color,
    borderLeftWidth: metrics.point,
    borderTopColor: 'transparent',
    borderTopWidth: metrics.side,
    left: Math.floor((frameSize - metrics.point) / 2),
    position: 'absolute' as const,
    top: Math.floor((frameSize - metrics.side * 2) / 2),
  };

  return (
    <IconFrame size={frameSize}>
      <View style={chevronStyle} />
    </IconFrame>
  );
}

export function TrashIcon({ color = '#6B7280', size = 16 }: IconProps) {
  return (
    <IconFrame size={size}>
      <View style={[styles.trashBody, { borderColor: color }]} />
      <View style={[styles.trashLid, { backgroundColor: color }]} />
      <View style={[styles.trashHandle, { backgroundColor: color }]} />
    </IconFrame>
  );
}

export function PlusIcon({ color = '#6B7280', size = 16 }: IconProps) {
  return (
    <IconFrame size={size}>
      <View style={[styles.plusHorizontal, { backgroundColor: color }]} />
      <View style={[styles.plusVertical, { backgroundColor: color }]} />
    </IconFrame>
  );
}

export function MoreHorizontalIcon({
  color = '#6B7280',
  size = 16,
}: IconProps) {
  return (
    <IconFrame size={size}>
      <View
        style={[styles.moreDot, styles.moreDotLeft, { backgroundColor: color }]}
      />
      <View
        style={[
          styles.moreDot,
          styles.moreDotCenter,
          { backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.moreDot,
          styles.moreDotRight,
          { backgroundColor: color },
        ]}
      />
    </IconFrame>
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    gap: 1.5,
    left: 2,
    position: 'absolute',
    top: 3,
  },
  gridRowBottom: {
    top: 9,
  },
  gridCell: {
    borderRadius: 1,
    height: 4,
    width: 4,
  },
  filterLineTop: {
    borderRadius: 1,
    height: 1.7,
    left: 2,
    position: 'absolute',
    top: 3,
    width: 14,
  },
  filterLineMiddle: {
    borderRadius: 1,
    height: 1.7,
    left: 4,
    position: 'absolute',
    top: 7,
    width: 10,
  },
  filterLineBottom: {
    borderRadius: 1,
    height: 1.7,
    left: 6,
    position: 'absolute',
    top: 11,
    width: 6,
  },
  downloadStem: {
    height: 7,
    left: 8,
    position: 'absolute',
    top: 3,
    width: 2,
  },
  downloadArrow: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderRightColor: 'transparent',
    borderRightWidth: 4,
    borderTopWidth: 5,
    left: 5,
    position: 'absolute',
    top: 8,
  },
  downloadBase: {
    borderRadius: 1,
    height: 2,
    left: 4,
    position: 'absolute',
    top: 14,
    width: 10,
  },
  searchCircle: {
    borderRadius: 5,
    borderWidth: 1.7,
    height: 9,
    left: 3,
    position: 'absolute',
    top: 3,
    width: 9,
  },
  searchHandle: {
    borderRadius: 1,
    height: 2,
    left: 10,
    position: 'absolute',
    top: 11,
    transform: [{ rotate: '45deg' }],
    width: 6,
  },
  trashBody: {
    borderRadius: 1,
    borderWidth: 1.4,
    height: 8,
    left: 4,
    position: 'absolute',
    top: 6,
    width: 8,
  },
  trashLid: {
    borderRadius: 1,
    height: 1.8,
    left: 3,
    position: 'absolute',
    top: 4,
    width: 10,
  },
  trashHandle: {
    borderRadius: 1,
    height: 1.6,
    left: 6,
    position: 'absolute',
    top: 2.5,
    width: 4,
  },
  plusHorizontal: {
    height: 2,
    left: 3,
    position: 'absolute',
    top: 7,
    width: 10,
  },
  plusVertical: {
    height: 10,
    left: 7,
    position: 'absolute',
    top: 3,
    width: 2,
  },
  moreDot: {
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    top: 7,
    width: 3,
  },
  moreDotLeft: {
    left: 2,
  },
  moreDotCenter: {
    left: 7,
  },
  moreDotRight: {
    left: 12,
  },
});
