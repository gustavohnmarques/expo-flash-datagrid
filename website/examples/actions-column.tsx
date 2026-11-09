import { MaterialIcons } from '@expo/vector-icons';
import {
  DataGrid,
  type ColumnDef,
  type RowActionMenuIconProps,
} from 'expo-flash-datagrid';

import { users, type User } from './data';

function MoreIcon({ color, size }: RowActionMenuIconProps) {
  return <MaterialIcons name="more-horiz" color={color} size={size} />;
}

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  {
    field: 'actions',
    headerName: 'Actions',
    type: 'actions',
    width: 132,
    align: 'center',
    headerAlign: 'center',
    actionTrigger: { display: 'both', icon: MoreIcon, label: 'Actions' },
    actions: ({ rowId }) => [
      {
        key: 'open',
        label: 'Open',
        onPress: () => console.log('open', rowId),
      },
      {
        key: 'share',
        label: 'Share',
        onPress: () => console.log('share', rowId),
      },
    ],
  },
];

export function ActionsColumnScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={columns}
      style={{ flex: 1 }}
    />
  );
}
