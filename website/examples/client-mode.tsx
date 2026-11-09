import { useState } from 'react';
import {
  DataGrid,
  type ColumnDef,
  type QueryState,
} from 'expo-flash-datagrid';

import { initialQuery, users, type User } from './data';

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1.3, minWidth: 180 },
  { field: 'city', headerName: 'City', flex: 1, minWidth: 130 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
  {
    field: 'salary',
    headerName: 'Salary',
    type: 'number',
    width: 120,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value) => `$${Number(value ?? 0).toFixed(0)}`,
  },
  {
    field: 'registeredAt',
    headerName: 'Registered',
    type: 'date',
    width: 130,
  },
];

export function ClientModeScreen() {
  const [query, setQuery] = useState<QueryState>(initialQuery);

  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      state={query}
      onStateChange={setQuery}
      enableMultiSort
      maxFilters={3}
      searchDebounceMs={280}
      pageSizeOptions={[10, 25, 50]}
      zebraRows
      style={{ flex: 1 }}
    />
  );
}
