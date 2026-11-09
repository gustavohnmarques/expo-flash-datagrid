import { useEffect, useState } from 'react';
import { DataGrid, type QueryState } from 'expo-flash-datagrid';

import { fetchUsers, initialQuery, userColumns, type User } from './data';

export function HybridSearchScreen() {
  const [query, setQuery] = useState<QueryState>(initialQuery);
  const [rows, setRows] = useState<User[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    let stale = false;

    fetchUsers(query).then((page) => {
      if (stale) return;
      setRows(page.rows);
      setRowCount(page.total);
    });

    return () => {
      stale = true;
    };
  }, [query]);

  return (
    <DataGrid<User>
      mode="server"
      serverSearchMode="localRows"
      serverLocalSearchText={localSearch}
      onServerLocalSearchTextChange={setLocalSearch}
      rows={rows}
      columns={userColumns}
      rowCount={rowCount}
      state={query}
      onStateChange={setQuery}
      style={{ flex: 1 }}
    />
  );
}
