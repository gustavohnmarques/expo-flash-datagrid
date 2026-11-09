import {
  DataGrid,
  getDefaultFilterOperatorsByType,
  type ColumnDef,
  type FilterOperator,
} from 'expo-flash-datagrid';

import { users, type User } from './data';

const inRange: FilterOperator<User> = {
  value: 'inRange',
  label: 'In range',
  requiresValue: true,
  inputType: 'text',
  apply: ({ cellValue, filterValue }) => {
    const [min, max] = String(filterValue ?? '')
      .split(',')
      .map(Number);
    const value = Number(cellValue);

    if (min === undefined || max === undefined) return false;
    return value >= min && value <= max;
  },
};

const numberOperators = [
  ...getDefaultFilterOperatorsByType<User>().number,
  inRange,
];

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
  { field: 'salary', headerName: 'Salary', type: 'number', width: 120 },
];

export function CustomOperatorScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      filterOperatorsByField={{ salary: numberOperators }}
      localeText={{ valuePlaceholder: 'min,max' }}
      style={{ flex: 1 }}
    />
  );
}
