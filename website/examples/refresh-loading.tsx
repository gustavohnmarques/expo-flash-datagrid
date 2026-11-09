import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { DataGrid } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

export function RefreshableScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={userColumns}
      refreshing={refreshing}
      onRefresh={refresh}
      loadingOverlay={<ActivityIndicator size="large" />}
      style={{ flex: 1 }}
    />
  );
}
