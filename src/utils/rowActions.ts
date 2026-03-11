import type {
  ColumnDef,
  GridRowActionItem,
  GridRowActionsSource,
  RowLongPressParams,
} from '../types';

export function isActionColumn<TRow>(column: ColumnDef<TRow>): boolean {
  return column.type === 'actions' || column.actions !== undefined;
}

export function hasRowActionContent<TRow>(
  action: GridRowActionItem<TRow>
): boolean {
  return Boolean(action.icon) || Boolean(action.label?.trim());
}

export function resolveRowActionsSource<TRow>(
  source: GridRowActionsSource<TRow> | undefined,
  params: RowLongPressParams<TRow>
): GridRowActionItem<TRow>[] {
  if (!source) {
    return [];
  }

  const actions = typeof source === 'function' ? source(params) : source;
  return actions.filter(hasRowActionContent);
}
