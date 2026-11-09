import { MaterialIcons } from '@expo/vector-icons';
import {
  DataGrid,
  type GridRowActionsSource,
  type RowActionMenuIconProps,
} from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

function EditIcon({ color, size }: RowActionMenuIconProps) {
  return <MaterialIcons name="edit" color={color} size={size} />;
}

function DeleteIcon({ color, size }: RowActionMenuIconProps) {
  return <MaterialIcons name="delete" color={color} size={size} />;
}

const rowActions: GridRowActionsSource<User> = ({ row }) => [
  {
    key: 'edit',
    label: 'Edit',
    icon: EditIcon,
    disabled: !row.active,
    onPress: ({ rowId }) => console.log('edit', rowId),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: DeleteIcon,
    destructive: true,
    onPress: ({ rowId }) => console.log('delete', rowId),
  },
];

export function RowActionsScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={userColumns}
      rowActions={rowActions}
      onRowActionMenuOpen={({ rowId, actions }) =>
        console.log(rowId, actions.length)
      }
      style={{ flex: 1 }}
    />
  );
}
