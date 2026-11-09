import {
  applyClientPipeline,
  type ColumnDef,
  type QueryState,
} from 'expo-flash-datagrid';

export type UserStatus = 'new' | 'active' | 'paused';

export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  age: number;
  salary: number;
  registeredAt: string;
  active: boolean;
  status: UserStatus;
}

export const users: User[] = [
  {
    id: '1',
    name: 'Alice Moreira',
    email: 'alice@company.com',
    city: 'Curitiba',
    age: 29,
    salary: 7200,
    registeredAt: '2024-02-11',
    active: true,
    status: 'active',
  },
  {
    id: '2',
    name: 'Bruno Lima',
    email: 'bruno@company.com',
    city: 'Recife',
    age: 34,
    salary: 5400,
    registeredAt: '2024-03-02',
    active: false,
    status: 'paused',
  },
  {
    id: '3',
    name: 'Camila Prado',
    email: 'camila@company.com',
    city: 'Santos',
    age: 41,
    salary: 9100,
    registeredAt: '2024-05-19',
    active: true,
    status: 'new',
  },
];

export const userColumns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'city', headerName: 'City', width: 130 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
];

export const initialQuery: QueryState = {
  paginationModel: { page: 0, pageSize: 25 },
  sortModel: [],
  filterModel: { items: [], logicOperator: 'and' },
  searchText: '',
  columnVisibilityModel: {},
  selectionModel: [],
};

export interface UsersPage {
  rows: User[];
  total: number;
}

/** Stands in for your HTTP client. */
export async function fetchUsers(query: QueryState): Promise<UsersPage> {
  const { paginatedRows, sortedRows } = applyClientPipeline({
    rows: users,
    columns: userColumns,
    filterModel: query.filterModel,
    searchText: query.searchText,
    sortModel: query.sortModel,
    paginationModel: query.paginationModel,
  });

  return { rows: paginatedRows, total: sortedRows.length };
}
