import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

import { users, type User } from './data';

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 2, minWidth: 180 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
  {
    field: 'age',
    headerName: 'Age',
    type: 'number',
    width: 90,
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'registeredAt',
    headerName: 'Registered',
    type: 'date',
    width: 130,
  },
  { field: 'active', headerName: 'Active', type: 'boolean', width: 90 },
];

export function ColumnsScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      style={{ flex: 1 }}
    />
  );
}
