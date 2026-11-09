import { DataGrid } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

export function FlashListOnBothPlatforms() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={userColumns}
      listMode="flash-list"
      drawDistance={400}
      rowHeight={52}
      style={{ flex: 1 }}
    />
  );
}
