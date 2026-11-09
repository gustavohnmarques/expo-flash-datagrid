import { useState } from 'react';
import {
  DataGrid,
  type ColumnDef,
  type ColumnVisibilityModel,
} from 'expo-flash-datagrid';

import { users, type User } from './data';

const columns: ColumnDef<User>[] = [
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 160,
    hideable: false,
  },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'city', headerName: 'City', width: 130 },
];

export function ColumnVisibilityScreen() {
  const [visibility, setVisibility] = useState<ColumnVisibilityModel>({
    email: false,
  });

  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      columnVisibilityModel={visibility}
      onColumnVisibilityModelChange={setVisibility}
      style={{ flex: 1 }}
    />
  );
}
