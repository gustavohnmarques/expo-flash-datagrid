import type {
  ColumnDef,
  ColumnType,
  FilterModel,
  FilterOperator,
  FilterOperatorsConfig,
} from '../types';
import { getCellValue, toValueArray } from './columnValues';
import { isActionColumn } from './rowActions';

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

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const compact = normalized.replace(/\s+/g, '');
    const commaCount = (compact.match(/,/g) ?? []).length;
    const dotCount = (compact.match(/\./g) ?? []).length;

    if (commaCount > 0 && dotCount > 0) {
      const lastComma = compact.lastIndexOf(',');
      const lastDot = compact.lastIndexOf('.');
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
      const sanitized = compact
        .split(thousandsSeparator)
        .join('')
        .replace(decimalSeparator, '.');
      const parsedLocalized = Number(sanitized);
      return Number.isFinite(parsedLocalized) ? parsedLocalized : null;
    }

    if (commaCount > 0 && dotCount === 0) {
      const sanitized = compact.replace(',', '.');
      const parsedLocalized = Number(sanitized);
      return Number.isFinite(parsedLocalized) ? parsedLocalized : null;
    }
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
    const normalized = value.trim();
    const isoMatch = normalized.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (isoMatch) {
      const [, year, month, day, hours, minutes, seconds] = isoMatch;
      return buildUtcDateValue(
        Number(year),
        Number(month),
        Number(day),
        Number(hours ?? 0),
        Number(minutes ?? 0),
        Number(seconds ?? 0)
      );
    }

    const localizedMatch = normalized.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (localizedMatch) {
      const [, day, month, year, hours, minutes, seconds] = localizedMatch;
      return buildUtcDateValue(
        Number(year),
        Number(month),
        Number(day),
        Number(hours ?? 0),
        Number(minutes ?? 0),
        Number(seconds ?? 0)
      );
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function buildUtcDateValue(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number
): number | null {
  const parsed = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  const date = new Date(parsed);

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hours &&
    date.getUTCMinutes() === minutes &&
    date.getUTCSeconds() === seconds;

  return isValid ? parsed : null;
}

function toComparableDateValue(value: number, columnType: ColumnType): number {
  if (columnType !== 'date') {
    return value;
  }

  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function createSelectOperators<TRow>(
  allowMultiple: boolean
): FilterOperator<TRow>[] {
  const equalsOperator: FilterOperator<TRow> = {
    value: 'equals',
    label: 'Equals',
    aliases: ['='],
    apply: ({ cellValue, filterValue }) =>
      toLowerString(cellValue) === toLowerString(filterValue),
  };
  const doesNotEqualOperator: FilterOperator<TRow> = {
    value: 'doesNotEqual',
    label: 'Does not equal',
    aliases: ['!=', 'notEquals'],
    apply: ({ cellValue, filterValue }) =>
      toLowerString(cellValue) !== toLowerString(filterValue),
  };
  const anyOfOperator: FilterOperator<TRow> = {
    value: 'isAnyOf',
    label: 'Is any of',
    inputType: 'multi',
    apply: ({ cellValue, filterValue }) => {
      const filterValues = toValueArray(filterValue).map((item) =>
        toLowerString(item)
      );
      if (!filterValues.length) {
        return true;
      }

      const cellValues = toValueArray(cellValue);
      if (cellValues.length) {
        return cellValues.some((item) =>
          filterValues.includes(toLowerString(item))
        );
      }

      return filterValues.includes(toLowerString(cellValue));
    },
  };
  const emptyOperators: FilterOperator<TRow>[] = [
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

  return allowMultiple
    ? [anyOfOperator, equalsOperator, doesNotEqualOperator, ...emptyOperators]
    : [equalsOperator, doesNotEqualOperator, anyOfOperator, ...emptyOperators];
}

const DEFAULT_SINGLE_SELECT_OPERATORS = createSelectOperators(false);
const DEFAULT_MULTI_SELECT_OPERATORS = createSelectOperators(true);

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
        const values = toValueArray(filterValue).map((item) =>
          toLowerString(item)
        );
        if (!values.length) {
          return true;
        }

        const cellValues = toValueArray(cellValue);
        if (cellValues.length) {
          return cellValues.some((item) =>
            values.includes(toLowerString(item))
          );
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
      label: 'Greater than',
      apply: ({ cellValue, filterValue }) => {
        const left = toNumber(cellValue);
        const right = toNumber(filterValue);
        return left !== null && right !== null ? left > right : false;
      },
    },
    {
      value: '>=',
      label: 'Greater than or equal to',
      apply: ({ cellValue, filterValue }) => {
        const left = toNumber(cellValue);
        const right = toNumber(filterValue);
        return left !== null && right !== null ? left >= right : false;
      },
    },
    {
      value: '<',
      label: 'Less than',
      apply: ({ cellValue, filterValue }) => {
        const left = toNumber(cellValue);
        const right = toNumber(filterValue);
        return left !== null && right !== null ? left < right : false;
      },
    },
    {
      value: '<=',
      label: 'Less than or equal to',
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
      apply: ({ cellValue, filterValue, column }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        const columnType = column.type ?? 'date';
        return left !== null && right !== null
          ? toComparableDateValue(left, columnType) ===
              toComparableDateValue(right, columnType)
          : false;
      },
    },
    {
      value: 'not',
      label: 'Is not',
      apply: ({ cellValue, filterValue, column }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        const columnType = column.type ?? 'date';
        return left !== null && right !== null
          ? toComparableDateValue(left, columnType) !==
              toComparableDateValue(right, columnType)
          : false;
      },
    },
    {
      value: 'before',
      label: 'Before',
      apply: ({ cellValue, filterValue, column }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        const columnType = column.type ?? 'date';
        return left !== null && right !== null
          ? toComparableDateValue(left, columnType) <
              toComparableDateValue(right, columnType)
          : false;
      },
    },
    {
      value: 'onOrBefore',
      label: 'On or before',
      apply: ({ cellValue, filterValue, column }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        const columnType = column.type ?? 'date';
        return left !== null && right !== null
          ? toComparableDateValue(left, columnType) <=
              toComparableDateValue(right, columnType)
          : false;
      },
    },
    {
      value: 'after',
      label: 'After',
      apply: ({ cellValue, filterValue, column }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        const columnType = column.type ?? 'date';
        return left !== null && right !== null
          ? toComparableDateValue(left, columnType) >
              toComparableDateValue(right, columnType)
          : false;
      },
    },
    {
      value: 'onOrAfter',
      label: 'On or after',
      apply: ({ cellValue, filterValue, column }) => {
        const left = parseDateLike(cellValue);
        const right = parseDateLike(filterValue);
        const columnType = column.type ?? 'date';
        return left !== null && right !== null
          ? toComparableDateValue(left, columnType) >=
              toComparableDateValue(right, columnType)
          : false;
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

export function getFilterOperatorsForColumn<TRow>(
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

  if (column.filterSelectOptions?.length) {
    return (
      column.filterSelectMultiple
        ? DEFAULT_MULTI_SELECT_OPERATORS
        : DEFAULT_SINGLE_SELECT_OPERATORS
    ) as FilterOperator<TRow>[];
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

function findOperatorForColumn<TRow>(
  column: ColumnDef<TRow>,
  operatorValue: string | undefined,
  options?: FilterOperatorsConfig<TRow>
): FilterOperator<TRow> | undefined {
  const operators = getFilterOperatorsForColumn(column, options);
  const resolvedOperatorValue = column.filterForceOperator ?? operatorValue;

  if (!resolvedOperatorValue) {
    return undefined;
  }

  return operators.find((candidate) =>
    matchesOperatorValue(candidate, resolvedOperatorValue)
  );
}

interface ResolvedFilterCondition<TRow> {
  column: ColumnDef<TRow>;
  operator: FilterOperator<TRow>;
  filterValue: unknown;
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
  const conditions: ResolvedFilterCondition<TRow>[] = [];

  items.forEach((item) => {
    const column = columnsByField.get(item.field);
    if (!column || isActionColumn(column) || column.filterable === false) {
      return;
    }

    const operator = findOperatorForColumn(column, item.operator, options);
    if (!operator) {
      return;
    }

    if (operator.requiresValue !== false && isEmptyValue(item.value)) {
      // Incomplete filters are treated as no-op to avoid blocking all rows.
      return;
    }

    const resolvedOperatorValue = column.filterForceOperator ?? item.operator;
    const normalizedFilterValue =
      resolvedOperatorValue === 'isTrue'
        ? true
        : resolvedOperatorValue === 'isFalse'
        ? false
        : item.value;

    conditions.push({
      column,
      operator,
      filterValue: normalizedFilterValue,
    });
  });

  if (!conditions.length) {
    return rows;
  }

  return rows.filter((row) => {
    if (logicOperator === 'or') {
      return conditions.some(({ column, operator, filterValue }) => {
        const cellValue = getCellValue(row, column);
        return operator.apply({
          cellValue,
          filterValue,
          row,
          column,
        });
      });
    }

    return conditions.every(({ column, operator, filterValue }) => {
      const cellValue = getCellValue(row, column);
      const isMatch = operator.apply({
        cellValue,
        filterValue,
        row,
        column,
      });
      return isMatch;
    });
  });
}
