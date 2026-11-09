import { useCallback, useEffect, useRef, useState } from 'react';
import { DataGrid, type QueryState } from 'expo-flash-datagrid';

import { fetchUsers, initialQuery, userColumns, type User } from './data';

export function ServerInfiniteScreen() {
  const [query, setQuery] = useState<QueryState>(initialQuery);
  const [rows, setRows] = useState<User[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const cursor = useRef(0);
  const requestId = useRef(0);

  const load = useCallback(
    async (page: number, append: boolean) => {
      const id = ++requestId.current;
      setLoading(true);

      const result = await fetchUsers({
        ...query,
        paginationModel: { ...query.paginationModel, page },
      });

      if (id !== requestId.current) return;

      cursor.current = page;
      setRows((previous) =>
        append ? [...previous, ...result.rows] : result.rows
      );
      setRowCount(result.total);
      setLoading(false);
    },
    [query]
  );

  useEffect(() => {
    load(0, false);
  }, [load]);

  const handleEndReached = useCallback(() => {
    const nextPage = cursor.current + 1;
    const nextOffset = nextPage * query.paginationModel.pageSize;

    if (!loading && nextOffset < rowCount) {
      load(nextPage, true);
    }
  }, [load, loading, query.paginationModel.pageSize, rowCount]);

  return (
    <DataGrid<User>
      mode="server"
      infinite
      rows={rows}
      columns={userColumns}
      rowCount={rowCount}
      loading={loading}
      state={query}
      onStateChange={setQuery}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      style={{ flex: 1 }}
    />
  );
}
