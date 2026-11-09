import { useState } from 'react';
import { DataGrid, type PaginationModel } from 'expo-flash-datagrid';

import { userColumns, users, type User } from './data';

export function PaginationScreen() {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({
    page: 0,
    pageSize: 10,
  });

  return (
    <DataGrid<User>
      mode="client"
      rows={users}
      columns={userColumns}
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      pageSizeOptions={[10, 20, 40]}
      style={{ flex: 1 }}
    />
  );
}
