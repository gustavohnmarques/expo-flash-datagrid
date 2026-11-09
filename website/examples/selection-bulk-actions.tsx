import { useState } from 'react';
import { Button, View } from 'react-native';
import { DataGrid, type GridRowId } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

export function BulkActionsScreen() {
  const [selection, setSelection] = useState<GridRowId[]>([]);

  const archiveSelected = () => {
    console.log('archive', selection);
    setSelection([]);
  };

  return (
    <View style={{ flex: 1 }}>
      <DataGrid<User>
        mode="client"
        rows={users}
        columns={userColumns}
        checkboxSelection
        selectionModel={selection}
        onSelectionModelChange={setSelection}
        style={{ flex: 1 }}
      />

      {selection.length > 0 ? (
        <Button
          title={`Archive ${selection.length}`}
          onPress={archiveSelected}
        />
      ) : null}
    </View>
  );
}
