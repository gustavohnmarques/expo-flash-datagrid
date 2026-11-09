import { DataGrid, type DataGridTheme } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

const darkTheme: DataGridTheme = {
  headerBackground: '#14233C',
  headerTextColor: '#E6EEF9',
  rowBackground: '#0D1A2E',
  rowAltBackground: '#111F36',
  rowTextColor: '#D8E4F6',
  borderColor: '#24395C',
  dividerColor: '#1C2E4C',
  selectionBackground: '#1D3A66',
  toolbarBackground: '#0D1A2E',
  toolbarTextColor: '#D8E4F6',
  footerBackground: '#0D1A2E',
  borderRadius: 12,
  cellPadding: 12,
  headerHeight: 48,
  footerHeight: 56,
};

export function DarkGridScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={userColumns}
      theme={darkTheme}
      zebraRows
      getRowStyle={(row) =>
        row.status === 'paused' ? { opacity: 0.6 } : undefined
      }
      style={{ flex: 1 }}
    />
  );
}
