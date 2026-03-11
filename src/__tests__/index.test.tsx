import { applySorting } from '../utils/sorting';

describe('library exports', () => {
  it('applies stable sorting', () => {
    const rows = [
      { id: 'a', group: 1 },
      { id: 'b', group: 2 },
      { id: 'c', group: 1 },
    ];
    const columns = [
      { field: 'group', headerName: 'Group', type: 'number' as const },
    ];

    const sorted = applySorting(rows, columns, [
      { field: 'group', sort: 'asc' },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(['a', 'c', 'b']);
  });
});
