import {
  applyClientPipeline,
  getPaginationRange,
} from 'expo-flash-datagrid';

import { initialQuery, userColumns, users } from '../data';

const { sortedRows, paginatedRows } = applyClientPipeline({
  ...initialQuery,
  rows: users,
  columns: userColumns,
  searchText: 'recife',
});

export const page = paginatedRows;
export const range = getPaginationRange(
  sortedRows.length,
  initialQuery.paginationModel
);
