import { DataGrid } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

export function EventsScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={userColumns}
      onRowPress={(row) => console.log('press', row.id)}
      onRowLongPress={(row) => console.log('long press', row.id)}
      onRowLongPressDetails={({ rowId, position }) =>
        console.log(rowId, position.pageX, position.pageY)
      }
      onCellPress={({ row, column }) => console.log(column.field, row.id)}
      onCellLongPress={({ row, column }) =>
        console.log(column.field, row.id)
      }
      style={{ flex: 1 }}
    />
  );
}
