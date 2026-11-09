import { useEffect, useState } from 'react';
import { DataGrid, type QueryState } from 'expo-flash-datagrid';

import { fetchUsers, initialQuery, userColumns, type User } from './data';

export function ServerPaginationScreen() {
  const [query, setQuery] = useState<QueryState>(initialQuery);
  const [rows, setRows] = useState<User[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let stale = false;
    setLoading(true);

    fetchUsers(query)
      .then((page) => {
        if (stale) return;
        setRows(page.rows);
        setRowCount(page.total);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [query]);

  return (
    <DataGrid<User>
      mode="server"
      rows={rows}
      columns={userColumns}
      rowCount={rowCount}
      loading={loading}
      state={query}
      onStateChange={setQuery}
      style={{ flex: 1 }}
    />
  );
}
