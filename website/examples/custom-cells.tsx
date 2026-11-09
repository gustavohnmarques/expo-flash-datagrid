import { StyleSheet, Text, View } from 'react-native';
import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

import { users, type User, type UserStatus } from './data';

const STATUS_COLORS: Record<UserStatus, string> = {
  new: '#2563EB',
  active: '#16A34A',
  paused: '#D97706',
};

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  {
    field: 'location',
    headerName: 'Location',
    width: 170,
    valueGetter: (row) => `${row.city} (${row.age})`,
  },
  {
    field: 'salary',
    headerName: 'Salary',
    type: 'number',
    width: 120,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value) =>
      `$${Number(value ?? 0).toLocaleString('en-US')}`,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: ({ row }) => (
      <View
        style={[
          styles.badge,
          { backgroundColor: STATUS_COLORS[row.status] },
        ]}
      >
        <Text style={styles.badgeLabel}>{row.status.toUpperCase()}</Text>
      </View>
    ),
    renderHeader: ({ column, sortDirection }) => (
      <Text style={styles.header}>
        {column.headerName}
        {sortDirection ? ` (${sortDirection})` : ''}
      </Text>
    ),
  },
];

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  header: { fontWeight: '700' },
});

export function CustomCellsScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      style={{ flex: 1 }}
    />
  );
}
