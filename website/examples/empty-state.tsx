import { Text, View } from 'react-native';
import { DataGrid } from 'expo-flash-datagrid';

import { userColumns, type User } from './data';

export function EmptyGridScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={[]}
      columns={userColumns}
      emptyState={
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ fontWeight: '700' }}>No customers yet</Text>
          <Text>Invite someone to see them here.</Text>
        </View>
      }
      style={{ flex: 1 }}
    />
  );
}
