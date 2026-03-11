import type {
  ColumnVisibilityModel,
  FilterItem,
  FilterModel,
  PaginationModel,
  QueryState,
  SortModel,
} from '../types';

function areArraysEqual<T>(
  left: readonly T[],
  right: readonly T[],
  comparator: (leftItem: T, rightItem: T) => boolean = Object.is
): boolean {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (!comparator(left[index] as T, right[index] as T)) {
      return false;
    }
  }

  return true;
}

function areVisibilityModelsEqual(
  left: ColumnVisibilityModel,
  right: ColumnVisibilityModel
): boolean {
  if (left === right) {
    return true;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

function areFilterValuesEqual(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) {
      return false;
    }

    return areArraysEqual(left, right, Object.is);
  }

  return Object.is(left, right);
}

function areFilterItemsEqual(left: FilterItem, right: FilterItem): boolean {
  return (
    left.id === right.id &&
    left.field === right.field &&
    left.operator === right.operator &&
    areFilterValuesEqual(left.value, right.value)
  );
}

export function arePaginationModelsEqual(
  left: PaginationModel,
  right: PaginationModel
): boolean {
  return left.page === right.page && left.pageSize === right.pageSize;
}

export function areSortModelsEqual(left: SortModel, right: SortModel): boolean {
  return areArraysEqual(
    left,
    right,
    (leftItem, rightItem) =>
      leftItem.field === rightItem.field && leftItem.sort === rightItem.sort
  );
}

export function areSelectionModelsEqual(
  left: QueryState['selectionModel'],
  right: QueryState['selectionModel']
): boolean {
  return areArraysEqual(left, right, Object.is);
}

export function areColumnVisibilityModelsEqual(
  left: ColumnVisibilityModel,
  right: ColumnVisibilityModel
): boolean {
  return areVisibilityModelsEqual(left, right);
}

export function areFilterModelsEqual(
  left: FilterModel,
  right: FilterModel
): boolean {
  const leftLogic = left.logicOperator ?? 'and';
  const rightLogic = right.logicOperator ?? 'and';

  return (
    leftLogic === rightLogic &&
    areArraysEqual(left.items, right.items, areFilterItemsEqual)
  );
}

export function areQueryStatesEqual(
  left: QueryState,
  right: QueryState
): boolean {
  return (
    arePaginationModelsEqual(left.paginationModel, right.paginationModel) &&
    areSortModelsEqual(left.sortModel, right.sortModel) &&
    areFilterModelsEqual(left.filterModel, right.filterModel) &&
    left.searchText === right.searchText &&
    areColumnVisibilityModelsEqual(
      left.columnVisibilityModel,
      right.columnVisibilityModel
    ) &&
    areSelectionModelsEqual(left.selectionModel, right.selectionModel)
  );
}
