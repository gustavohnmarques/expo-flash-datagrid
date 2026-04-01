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
  status: string;
  hiddenNote: string;
}

const rows: DemoRow[] = [
  {
    id: '1',
    name: 'Alice',
    age: 31,
    joinedAt: '2024-01-01T10:30:00Z',
    active: true,
    score: 8,
    status: 'CODE-01',
    hiddenNote: 'internal alice',
  },
  {
    id: '2',
    name: 'Bob',
    age: 24,
    joinedAt: '2024-02-01T12:00:00Z',
    active: false,
    score: 8,
    status: 'CODE-02',
    hiddenNote: 'internal bob',
  },
  {
    id: '3',
    name: 'Carla',
    age: 39,
    joinedAt: '2023-12-01T08:15:00Z',
    active: true,
    score: 5,
    status: 'CODE-03',
    hiddenNote: 'internal carla',
  },
];

const columns: ColumnDef<DemoRow>[] = [
  { field: 'name', headerName: 'Name', type: 'string' },
  { field: 'age', headerName: 'Age', type: 'number', filterable: true },
  {
    field: 'joinedAt',
    headerName: 'Joined At',
    type: 'date',
    filterable: true,
    valueFormatter: (value) => {
      const [year, month, day] = String(value).slice(0, 10).split('-');
      return `${day}/${month}/${year}`;
    },
  },
  { field: 'active', headerName: 'Active', type: 'boolean', filterable: true },
  {
    field: 'status',
    headerName: 'Status',
    filterable: true,
    filterSelectOptions: [
      { value: 'CODE-01', label: 'Disponivel' },
      { value: 'CODE-02', label: 'Em andamento' },
      { value: 'CODE-03', label: 'Finalizado' },
    ],
  },
  { field: 'score', headerName: 'Score', type: 'number' },
  {
    field: 'hiddenNote',
    headerName: 'Hidden note',
    searchable: false,
  },
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

  it('supports localized date inputs and compares date columns by day', () => {
    const filtered = applyFilter(rows, columns, {
      items: [{ field: 'joinedAt', operator: 'is', value: '01/01/2024' }],
    });

    expect(filtered.map((row) => row.id)).toEqual(['1']);
  });

  it('supports select filters with single or multiple values', () => {
    const anyOfFiltered = applyFilter(rows, columns, {
      items: [
        {
          field: 'status',
          operator: 'isAnyOf',
          value: ['CODE-01', 'CODE-03'],
        },
      ],
    });
    const singleFiltered = applyFilter(rows, columns, {
      items: [{ field: 'status', operator: 'isAnyOf', value: 'CODE-02' }],
    });

    expect(anyOfFiltered.map((row) => row.id)).toEqual(['1', '3']);
    expect(singleFiltered.map((row) => row.id)).toEqual(['2']);
  });

  it('treats incomplete filters as no-op for both and/or logic', () => {
    const andFiltered = applyFilter(rows, columns, {
      logicOperator: 'and',
      items: [{ field: 'name', operator: 'contains', value: '' }],
    });
    const orFiltered = applyFilter(rows, columns, {
      logicOperator: 'or',
      items: [{ field: 'name', operator: 'contains', value: '' }],
    });

    expect(andFiltered.map((row) => row.id)).toEqual(['1', '2', '3']);
    expect(orFiltered.map((row) => row.id)).toEqual(['1', '2', '3']);
  });
});

describe('searching', () => {
  it('searches all columns by default and respects opt-out columns', () => {
    const resultByName = applySearch(rows, columns, 'alice');
    const resultByAge = applySearch(rows, columns, '39');
    const resultByNonSearchableField = applySearch(rows, columns, 'internal');

    expect(resultByName.map((row) => row.id)).toEqual(['1']);
    expect(resultByAge.map((row) => row.id)).toEqual(['3']);
    expect(resultByNonSearchableField).toHaveLength(0);
  });

  it('matches formatted values and select option labels', () => {
    const resultByFormattedDate = applySearch(rows, columns, '01/02/2024');
    const resultByStatusLabel = applySearch(rows, columns, 'Finalizado');

    expect(resultByFormattedDate.map((row) => row.id)).toEqual(['2']);
    expect(resultByStatusLabel.map((row) => row.id)).toEqual(['3']);
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
