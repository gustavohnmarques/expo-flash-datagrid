import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

import { users, type User } from './data';

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
  {
    field: 'registeredAt',
    headerName: 'Registered',
    type: 'date',
    width: 130,
  },
  {
    field: 'active',
    headerName: 'Active',
    type: 'boolean',
    width: 90,
    valueFormatter: (value) => (value ? 'Yes' : 'No'),
  },
];

export function TypedFiltersScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      maxFilters={3}
      initialState={{
        filterModel: {
          items: [
            {
              id: 'recent',
              field: 'registeredAt',
              operator: 'onOrAfter',
              value: '2024-03-01',
            },
          ],
          logicOperator: 'and',
        },
      }}
      style={{ flex: 1 }}
    />
  );
}
