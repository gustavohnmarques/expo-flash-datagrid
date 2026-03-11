import type { ColumnDef, RowLongPressParams } from '../types';
import { isActionColumn, resolveRowActionsSource } from '../utils/rowActions';

type TestRow = {
  id: string;
  name: string;
};

const baseParams: RowLongPressParams<TestRow> = {
  position: { pageX: 12, pageY: 18 },
  row: {
    id: 'row-1',
    name: 'Alice',
  },
  rowId: 'row-1',
};

describe('row actions helpers', () => {
  it('resolves actions from static arrays and callbacks', () => {
    const action = {
      key: 'checkout',
      label: 'Checkout',
      onPress: jest.fn(),
    };

    expect(resolveRowActionsSource([action], baseParams)).toEqual([action]);
    expect(
      resolveRowActionsSource(
        ({ rowId }) => [{ ...action, key: rowId }],
        baseParams
      )
    ).toEqual([{ ...action, key: 'row-1' }]);
  });

  it('treats columns with actions config or actions type as action columns', () => {
    const actionsColumn: ColumnDef<TestRow> = {
      field: 'actions',
      headerName: 'Actions',
      actions: [],
    };
    const typedActionsColumn: ColumnDef<TestRow> = {
      field: 'menu',
      headerName: 'Menu',
      type: 'actions',
    };
    const regularColumn: ColumnDef<TestRow> = {
      field: 'name',
      headerName: 'Name',
    };

    expect(isActionColumn(actionsColumn)).toBe(true);
    expect(isActionColumn(typedActionsColumn)).toBe(true);
    expect(isActionColumn(regularColumn)).toBe(false);
  });
});
