import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

import { users, type User } from './data';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

const CITY_OPTIONS = [
  { value: 'Curitiba', label: 'Curitiba' },
  { value: 'Recife', label: 'Recife' },
  { value: 'Santos', label: 'Santos' },
];

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  {
    field: 'city',
    headerName: 'City',
    width: 130,
    filterSelectOptions: CITY_OPTIONS,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    filterSelectOptions: STATUS_OPTIONS,
    filterSelectMultiple: true,
    filterForceOperator: 'isAnyOf',
    filterHideOperator: true,
  },
];

export function SelectFiltersScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      maxFilters={2}
      style={{ flex: 1 }}
    />
  );
}
