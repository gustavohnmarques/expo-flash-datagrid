import type {
  ColumnDef,
  ColumnType,
  FilterModel,
  FilterOperator,
  FilterOperatorsConfig,
} from '../types';
import { isActionColumn } from './rowActions';

function getCellValue<TRow>(row: TRow, column: ColumnDef<TRow>): unknown {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }

  return (row as Record<string, unknown>)[column.field];
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function toLowerString(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return null;
}

function parseDateLike(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function createStringOperators<TRow>(): FilterOperator<TRow>[] {
  return [
    {
      value: 'contains',
      label: 'Contains',
      apply: ({ cellValue, filterValue }) =>
        toLowerString(cellValue).includes(toLowerString(filterValue)),
    },
    {
      value: 'doesNotContain',
      label: 'Does not contain',
      aliases: ['notContains'],
      apply: ({ cellValue, filterValue }) =>
        !toLowerString(cellValue).includes(toLowerString(filterValue)),
    },
    {
      value: 'equals',
      label: 'Equals',
      aliases: ['='],
      apply: ({ cellValue, filterValue }) =>
        toLowerString(cellValue) === toLowerString(filterValue),
    },
    {
      value: 'doesNotEqual',
      label: 'Does not equal',
      aliases: ['!=', 'notEquals'],
      apply: ({ cellValue, filterValue }) =>
        toLowerString(cellValue) !== toLowerString(filterValue),
    },
    {
      value: 'startsWith',
      label: 'Starts with',
      apply: ({ cellValue, filterValue }) =>
        toLowerString(cellValue).startsWith(toLowerString(filterValue)),
    },
    {
      value: 'endsWith',
      label: 'Ends with',
      apply: ({ cellValue, filterValue }) =>
        toLowerString(cellValue).endsWith(toLowerString(filterValue)),
    },
    {
      value: 'isEmpty',
      label: 'Is empty',
      requiresValue: false,
      apply: ({ cellValue }) => isEmptyValue(cellValue),
    },
    {
      value: 'isNotEmpty',
      label: 'Is not empty',
      requiresValue: false,
      apply: ({ cellValue }) => !isEmptyValue(cellValue),
    },
    {
      value: 'isAnyOf',
      label: 'Is any of',
      inputType: 'multi',
      apply: ({ cellValue, filterValue }) => {
        const values = toArray(filterValue).map((item) => toLowerString(item));
        if (!values.length) {
          return true;
        }
        return values.includes(toLowerString(cellValue));
      },
    },
  ];
}

function createNumberOperators<TRow>(): FilterOperator<TRow>[] {
  return [
    {
      value: 'equals',
      label: 'Equals',
      aliases: ['='],
      apply: ({ cellValue, filterValue }) =>
        toNumber(cellValue) === toNumber(filterValue),
    },
    {
      value: 'doesNotEqual',
      label: 'Does not equal',
      aliases: ['!=', 'notEquals'],
      apply: ({ cellValue, filterValue }) =>
        toNumber(cellValue) !== toNumber(filterValue),
    },
    {
      value: '>',
      label: '>',
      apply: ({ cellValue, filterValue }) => {
        const left = toNumber(cellValue);
        const right = toNumber(filterValue);
        return left !== null && right !== null ? left > right : false;
      },
    },
    {
      value: '>=',
      label: '>=',
      apply: ({ cellValue, filterValue }) => {
        const left = toNumber(cellValue);
        const right = toNumber(filterValue);
        return left !== null && right !== null ? left >= right : false;
      },
    },
    {
      value: '<',
      label: '<',
      apply: ({ cellValue, filterValue }) => {
        const left = toNumber(cellValue);
        const right = toNumber(filterValue);
        return left !== null && right !== null ? left < right : false;
      },
    },
    {
      value: '<=',
      label: '<=',
      apply: ({ cellValue, filterValue }) => {
        const left = toNumber(cellValue);
        const right = toNumber(filterValue);
        return left !== null && right !== null ? left <= right : false;
      },
    },
    {
      value: 'isEmpty',
      label: 'Is empty',
      requiresValue: false,
      apply: ({ cellValue }) => isEmptyValue(cellValue),
    },
    {
      value: 'isNotEmpty',
      label: 'Is not empty',
      requiresValue: false,
      apply: ({ cellValue }) => !isEmptyValue(cellValue),
    },
  ];
}

function createDateOperators<TRow>(): FilterOperator<TRow>[] {
  return [
    {
      value: 'is',
      label: 'Is',
      apply: ({ cellValue, filterValue }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        return left !== null && right !== null ? left === right : false;
      },
    },
    {
      value: 'not',
      label: 'Is not',
      apply: ({ cellValue, filterValue }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        return left !== null && right !== null ? left !== right : false;
      },
    },
    {
      value: 'before',
      label: 'Before',
      apply: ({ cellValue, filterValue }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        return left !== null && right !== null ? left < right : false;
      },
    },
    {
      value: 'onOrBefore',
      label: 'On or before',
      apply: ({ cellValue, filterValue }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        return left !== null && right !== null ? left <= right : false;
      },
    },
    {
      value: 'after',
      label: 'After',
      apply: ({ cellValue, filterValue }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        return left !== null && right !== null ? left > right : false;
      },
    },
    {
      value: 'onOrAfter',
      label: 'On or after',
      apply: ({ cellValue, filterValue }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        return left !== null && right !== null ? left >= right : false;
      },
    },
    {
      value: 'isEmpty',
      label: 'Is empty',
      requiresValue: false,
      apply: ({ cellValue }) => isEmptyValue(cellValue),
    },
    {
      value: 'isNotEmpty',
      label: 'Is not empty',
      requiresValue: false,
      apply: ({ cellValue }) => !isEmptyValue(cellValue),
    },
  ];
}

function createBooleanOperators<TRow>(): FilterOperator<TRow>[] {
  return [
    {
      value: 'is',
      label: 'Is',
      inputType: 'boolean',
      aliases: ['isTrue', 'isFalse'],
      apply: ({ cellValue, filterValue }) => {
        const left = toBoolean(cellValue);
        const right = toBoolean(filterValue);
        return left !== null && right !== null ? left === right : false;
      },
    },
    {
      value: 'isEmpty',
      label: 'Is empty',
      requiresValue: false,
      apply: ({ cellValue }) => isEmptyValue(cellValue),
    },
  ];
}

const DEFAULT_TYPE_OPERATORS: Record<ColumnType, FilterOperator<unknown>[]> = {
  string: createStringOperators(),
  number: createNumberOperators(),
  date: createDateOperators(),
  datetime: createDateOperators(),
  boolean: createBooleanOperators(),
  actions: createStringOperators(),
  custom: createStringOperators(),
};

function resolveColumnType<TRow>(column: ColumnDef<TRow>): ColumnType {
  return column.type ?? 'string';
}

function getOperatorsForColumn<TRow>(
  column: ColumnDef<TRow>,
  options?: FilterOperatorsConfig<TRow>
): FilterOperator<TRow>[] {
  if (column.filterOperators?.length) {
    return column.filterOperators;
  }

  const byField = options?.filterOperatorsByField?.[column.field];
  if (byField?.length) {
    return byField;
  }

  const columnType = resolveColumnType(column);
  const byType = options?.filterOperatorsByType?.[columnType];
  if (byType?.length) {
    return byType;
  }

  return DEFAULT_TYPE_OPERATORS[columnType] as FilterOperator<TRow>[];
}

function matchesOperatorValue<TRow>(
  candidate: FilterOperator<TRow>,
  value: string
): boolean {
  return (
    candidate.value === value || candidate.aliases?.includes(value) === true
  );
}

export function getDefaultFilterOperatorsByType<TRow = unknown>(): Record<
  ColumnType,
  FilterOperator<TRow>[]
> {
  return DEFAULT_TYPE_OPERATORS as Record<ColumnType, FilterOperator<TRow>[]>;
}

export function applyFilter<TRow>(
  rows: TRow[],
  columns: ColumnDef<TRow>[],
  filterModel: FilterModel,
  options?: FilterOperatorsConfig<TRow>
): TRow[] {
  const items = filterModel.items.filter(
    (item) => Boolean(item.field) && Boolean(item.operator)
  );

  if (!items.length) {
    return rows;
  }

  const columnsByField = new Map(
    columns.map((column) => [column.field, column])
  );
  const logicOperator = filterModel.logicOperator ?? 'and';

  return rows.filter((row) => {
    let hasAnyCondition = false;
    let matchedAny = false;

    for (const item of items) {
      const column = columnsByField.get(item.field);
      if (!column || isActionColumn(column) || column.filterable === false) {
        continue;
      }

      const operators = getOperatorsForColumn(column, options);
      const operator = operators.find((candidate) =>
        matchesOperatorValue(candidate, item.operator)
      );
      if (!operator) {
        continue;
      }

      hasAnyCondition = true;

      if (operator.requiresValue !== false && isEmptyValue(item.value)) {
        // Incomplete filter is treated as no-op to avoid blocking all rows.
        continue;
      }

      const normalizedFilterValue =
        item.operator === 'isTrue'
          ? true
          : item.operator === 'isFalse'
          ? false
          : item.value;
      const cellValue = getCellValue(row, column);
      const isMatch = operator.apply({
        cellValue,
        filterValue: normalizedFilterValue,
        row,
        column,
      });

      if (logicOperator === 'or') {
        if (isMatch) {
          matchedAny = true;
          break;
        }
      } else if (!isMatch) {
        return false;
      }
    }

    if (!hasAnyCondition) {
      return true;
    }

    return logicOperator === 'or' ? matchedAny : true;
  });
}
