import { View } from 'react-native';
import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

type User = {
  id: string;
  name: string;
  email: string;
  age: number;
};

const rows: User[] = [
  { id: '1', name: 'Alice', email: 'alice@company.com', age: 29 },
  { id: '2', name: 'Bruno', email: 'bruno@company.com', age: 34 },
];

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'email', headerName: 'Email', flex: 1.2 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
];

export function UsersScreen() {
  return (
    <View style={{ flex: 1 }}>
      <DataGrid<User>
        mode="client"
        rows={rows}
        columns={columns}
        style={{ flex: 1 }}
      />
    </View>
  );
}
