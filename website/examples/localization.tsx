import { DataGrid } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

export function PortugueseGridScreen() {
  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={userColumns}
      locale="pt"
      emptyLabel="Nenhum cliente encontrado"
      localeText={{
        rowsPerPage: 'Itens por página',
        selectedRowsLabel: '{count} cliente(s)',
        operatorLabels: { contains: 'inclui' },
      }}
      style={{ flex: 1 }}
    />
  );
}
