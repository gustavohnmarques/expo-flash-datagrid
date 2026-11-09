import { useState } from 'react';
import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

import { users, type User } from './data';

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'city', headerName: 'City', width: 130 },
  { field: 'email', headerName: 'Email', width: 200, searchable: false },
];

export function SearchScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchDebounceMs={200}
      style={{ flex: 1 }}
    />
  );
}
