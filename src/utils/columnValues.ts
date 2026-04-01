import type { ColumnDef, FilterSelectOption } from '../types';

export function getCellValue<TRow>(
  row: TRow,
  column: ColumnDef<TRow>
): unknown {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }

  return (row as Record<string, unknown>)[column.field];
}

export function areColumnValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (
    left === null ||
    left === undefined ||
    right === null ||
    right === undefined
  ) {
    return false;
  }

  return String(left) === String(right);
}

export function toValueArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [value];
}

export function findFilterSelectOption(
  options: FilterSelectOption[] | undefined,
  value: unknown
): FilterSelectOption | undefined {
  return options?.find((option) => areColumnValuesEqual(option.value, value));
}

export function createFilterSelectOptionLabelMap(
  options: FilterSelectOption[] | undefined
): Map<string, string> | undefined {
  if (!options?.length) {
    return undefined;
  }

  const labelsByValue = new Map<string, string>();

  options.forEach((option) => {
    const key = String(option.value);

    if (!labelsByValue.has(key)) {
      labelsByValue.set(key, option.label);
    }
  });

  return labelsByValue;
}

export function resolveFilterOptionLabels(
  options: FilterSelectOption[] | undefined,
  value: unknown
): string[] {
  const labels = toValueArray(value)
    .map((item) => findFilterSelectOption(options, item)?.label)
    .filter((label): label is string => Boolean(label));

  return Array.from(new Set(labels));
}
