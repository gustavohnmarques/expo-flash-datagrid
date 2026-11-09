import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import {
  DataGrid,
  type ColumnDef,
  type SortModel,
} from 'expo-flash-datagrid';

import { users, type User } from './data';

const STATUS_ORDER = ['new', 'active', 'paused'];

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    sortComparator: (a, b) =>
      STATUS_ORDER.indexOf(String(a)) - STATUS_ORDER.indexOf(String(b)),
  },
  { field: 'email', headerName: 'Email', width: 200, sortable: false },
];

export function SortingScreen() {
  const [sortModel, setSortModel] = useState<SortModel>([
    { field: 'name', sort: 'asc' },
  ]);

  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      enableMultiSort
      showUnsortedSortIcon
      sortIcons={{
        asc: <MaterialIcons name="arrow-upward" size={14} />,
        desc: <MaterialIcons name="arrow-downward" size={14} />,
        none: <MaterialIcons name="unfold-more" size={14} />,
      }}
      style={{ flex: 1 }}
    />
  );
}
