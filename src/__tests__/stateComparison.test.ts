import type { QueryState } from '../types';
import {
  areColumnVisibilityModelsEqual,
  areFilterModelsEqual,
  arePaginationModelsEqual,
  areQueryStatesEqual,
  areSelectionModelsEqual,
  areSortModelsEqual,
} from '../utils/stateComparison';

const baseState: QueryState = {
  paginationModel: { page: 0, pageSize: 25 },
  sortModel: [{ field: 'name', sort: 'asc' }],
  filterModel: {
    items: [{ id: '1', field: 'active', operator: 'is', value: true }],
    logicOperator: 'and',
  },
  searchText: 'alice',
  columnVisibilityModel: { salary: false },
  selectionModel: ['row-1', 'row-2'],
};

describe('state comparison helpers', () => {
  it('treats equivalent query states as equal', () => {
    const nextState: QueryState = {
      paginationModel: { page: 0, pageSize: 25 },
      sortModel: [{ field: 'name', sort: 'asc' }],
      filterModel: {
        items: [{ id: '1', field: 'active', operator: 'is', value: true }],
        logicOperator: 'and',
      },
      searchText: 'alice',
      columnVisibilityModel: { salary: false },
      selectionModel: ['row-1', 'row-2'],
    };

    expect(
      arePaginationModelsEqual(
        baseState.paginationModel,
        nextState.paginationModel
      )
    ).toBe(true);
    expect(areSortModelsEqual(baseState.sortModel, nextState.sortModel)).toBe(
      true
    );
    expect(
      areFilterModelsEqual(baseState.filterModel, nextState.filterModel)
    ).toBe(true);
    expect(
      areColumnVisibilityModelsEqual(
        baseState.columnVisibilityModel,
        nextState.columnVisibilityModel
      )
    ).toBe(true);
    expect(
      areSelectionModelsEqual(
        baseState.selectionModel,
        nextState.selectionModel
      )
    ).toBe(true);
    expect(areQueryStatesEqual(baseState, nextState)).toBe(true);
  });

  it('detects meaningful differences', () => {
    const nextState: QueryState = {
      ...baseState,
      paginationModel: { page: 1, pageSize: 25 },
      filterModel: {
        items: [{ id: '1', field: 'active', operator: 'is', value: false }],
        logicOperator: 'and',
      },
      selectionModel: ['row-1'],
    };

    expect(
      arePaginationModelsEqual(
        baseState.paginationModel,
        nextState.paginationModel
      )
    ).toBe(false);
    expect(
      areFilterModelsEqual(baseState.filterModel, nextState.filterModel)
    ).toBe(false);
    expect(
      areSelectionModelsEqual(
        baseState.selectionModel,
        nextState.selectionModel
      )
    ).toBe(false);
    expect(areQueryStatesEqual(baseState, nextState)).toBe(false);
  });
});
