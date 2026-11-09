import {
  applyClientPipeline,
  formatLocale,
  getPaginationRange,
  EN_LOCALE_TEXT,
  type QueryState,
} from 'expo-flash-datagrid';

import { initialQuery, userColumns, users } from './data';

const query: QueryState = {
  ...initialQuery,
  searchText: 'recife',
  sortModel: [{ field: 'name', sort: 'asc' }],
};

const { sortedRows, paginatedRows } = applyClientPipeline({
  rows: users,
  columns: userColumns,
  filterModel: query.filterModel,
  searchText: query.searchText,
  sortModel: query.sortModel,
  paginationModel: query.paginationModel,
});

const { from, to, total } = getPaginationRange(
  sortedRows.length,
  query.paginationModel
);

console.log(
  paginatedRows,
  `${from}-${to} ${EN_LOCALE_TEXT.ofLabel} ${total}`
);
console.log(formatLocale(EN_LOCALE_TEXT.selectedRowsLabel, { count: 3 }));
