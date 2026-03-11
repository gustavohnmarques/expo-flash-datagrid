import { applyFilter } from '../utils/filtering';
import { applyClientPipeline, paginateRows } from '../utils/pagination';
import { applySearch } from '../utils/searching';
import { applySorting } from '../utils/sorting';
import type { ColumnDef } from '../types';

interface DemoRow {
  id: string;
  name: string;
  age: number;
  joinedAt: string;
  active: boolean;
  score: number;
}

const rows: DemoRow[] = [
  {
    id: '1',
    name: 'Alice',
    age: 31,
    joinedAt: '2024-01-01',
    active: true,
    score: 8,
  },
  {
    id: '2',
    name: 'Bob',
    age: 24,
    joinedAt: '2024-02-01',
    active: false,
    score: 8,
  },
  {
    id: '3',
    name: 'Carla',
    age: 39,
    joinedAt: '2023-12-01',
    active: true,
    score: 5,
  },
];

const columns: ColumnDef<DemoRow>[] = [
  { field: 'name', headerName: 'Name', type: 'string', searchable: true },
  { field: 'age', headerName: 'Age', type: 'number', filterable: true },
  {
    field: 'joinedAt',
    headerName: 'Joined At',
    type: 'date',
    filterable: true,
  },
  { field: 'active', headerName: 'Active', type: 'boolean', filterable: true },
  { field: 'score', headerName: 'Score', type: 'number' },
];

describe('filtering', () => {
  it('filters with string contains', () => {
    const filtered = applyFilter(rows, columns, {
      items: [{ field: 'name', operator: 'contains', value: 'al' }],
    });

    expect(filtered.map((row) => row.id)).toEqual(['1']);
  });

  it('supports number and boolean operators with and logic', () => {
    const filtered = applyFilter(rows, columns, {
      logicOperator: 'and',
      items: [
        { field: 'age', operator: '>=', value: 30 },
        { field: 'active', operator: 'is', value: true },
      ],
    });

    expect(filtered.map((row) => row.id)).toEqual(['1', '3']);
  });

  it('supports backend operator names and legacy aliases', () => {
    const filtered = applyFilter(rows, columns, {
      logicOperator: 'and',
      items: [
        { field: 'name', operator: 'doesNotContain', value: 'bo' },
        { field: 'joinedAt', operator: 'onOrBefore', value: '2024-01-01' },
      ],
    });

    expect(filtered.map((row) => row.id)).toEqual(['1', '3']);
  });
});

describe('searching', () => {
  it('searches only searchable columns', () => {
    const resultByName = applySearch(rows, columns, 'ali');
    const resultByNonSearchableField = applySearch(rows, columns, '39');

    expect(resultByName.map((row) => row.id)).toEqual(['1']);
    expect(resultByNonSearchableField).toHaveLength(0);
  });
});

describe('sorting', () => {
  it('keeps order stable when comparator ties', () => {
    const sorted = applySorting(rows, columns, [
      { field: 'score', sort: 'asc' },
    ]);
    expect(sorted.map((row) => row.id)).toEqual(['3', '1', '2']);
  });
});

describe('pagination', () => {
  it('slices the current page', () => {
    const paged = paginateRows(rows, { page: 1, pageSize: 2 });
    expect(paged.map((row) => row.id)).toEqual(['3']);
  });
});

describe('client pipeline', () => {
  it('applies filter -> search -> sort -> paginate', () => {
    const result = applyClientPipeline({
      rows,
      columns,
      filterModel: {
        items: [{ field: 'active', operator: 'is', value: true }],
      },
      searchText: 'a',
      sortModel: [{ field: 'age', sort: 'desc' }],
      paginationModel: { page: 0, pageSize: 1 },
    });

    expect(result.filteredRows.map((row) => row.id)).toEqual(['1', '3']);
    expect(result.searchedRows.map((row) => row.id)).toEqual(['1', '3']);
    expect(result.sortedRows.map((row) => row.id)).toEqual(['3', '1']);
    expect(result.paginatedRows.map((row) => row.id)).toEqual(['3']);
  });
});
