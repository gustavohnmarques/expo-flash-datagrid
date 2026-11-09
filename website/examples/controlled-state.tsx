import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DataGrid, type FilterModel } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

const activeAdults: FilterModel = {
  items: [{ id: 'adults', field: 'age', operator: '>=', value: 30 }],
  logicOperator: 'and',
};

const noFilters: FilterModel = { items: [], logicOperator: 'and' };

export function SavedFilterScreen() {
  const [filterModel, setFilterModel] = useState<FilterModel>(noFilters);

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => setFilterModel(activeAdults)}>
        <Text>Saved filter: age 30+</Text>
      </Pressable>

      <DataGrid<User>
        mode="client"
        rows={users}
        columns={userColumns}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        initialState={{ sortModel: [{ field: 'name', sort: 'asc' }] }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
