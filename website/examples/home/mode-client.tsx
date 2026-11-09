import { DataGrid } from 'expo-flash-datagrid';

import { userColumns as columns, users as rows, type User } from '../data';

export const grid = (
  <DataGrid<User>
    mode="client"
    rows={rows}
    columns={columns}
  />
);
