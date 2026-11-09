import { DataGrid, type QueryState } from 'expo-flash-datagrid';

import { userColumns as columns, type User } from '../data';

export const grid = (rows: User[], total: number, onQuery: (q: QueryState) => void) => (
  <DataGrid<User>
    mode="server"
    serverSearchMode="localRows"
    rows={rows}
    columns={columns}
    rowCount={total}
    onQueryChange={onQuery}
  />
);
