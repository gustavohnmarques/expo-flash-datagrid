import type { DataGridLocale, DataGridLocaleText } from '../types';

export const EN_LOCALE_TEXT: DataGridLocaleText = {
  toolbarColumns: 'Columns',
  toolbarFilters: 'Filters',
  toolbarExport: 'Export',
  toolbarSearch: 'Search',
  selectedRowsLabel: '{count} selected',
  clearSelection: 'Clear',

  searchTitle: 'Search rows',
  searchPlaceholder: 'Type to search...',
  searchApply: 'Confirm',
  searchClear: 'Clear',
  cancel: 'Cancel',

  columnsTitle: 'Columns',
  done: 'Done',
  searchColumnsPlaceholder: 'Search columns',
  showAll: 'Show all',
  hideAll: 'Hide all',
  reset: 'Reset',
  allColumnsVisible: 'All columns visible',
  someColumnsHidden: 'Some columns hidden',

  filtersTitle: 'Filters',
  addFilter: 'Add filter',
  logicAnd: 'And',
  logicOr: 'Or',
  noFilters: 'No filters.',
  fieldLabel: 'Columns',
  operatorLabel: 'Operator',
  valueLabel: 'Value',
  valuePlaceholder: 'Filter value',
  valueBetweenPlaceholder: 'min,max',
  booleanTrueLabel: 'True',
  booleanFalseLabel: 'False',
  removeFilter: 'Clear filter',

  rowsPerPage: 'Rows per page',
  ofLabel: 'of',
  loadingMoreRows: 'Loading more rows...',
  rowsLoadedLabel: '{count} rows loaded',

  emptyLabel: 'No records found',
  operatorLabels: {
    'contains': 'contains',
    'doesNotContain': 'does not contain',
    'equals': 'equals',
    'doesNotEqual': 'does not equal',
    'startsWith': 'starts with',
    'endsWith': 'ends with',
    'isEmpty': 'is empty',
    'isNotEmpty': 'is not empty',
    'isAnyOf': 'is any of',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
    'is': 'is',
    'not': 'is not',
    'before': 'before',
    'onOrBefore': 'on or before',
    'after': 'after',
    'onOrAfter': 'on or after',
    '=': '=',
    '!=': '!=',
    'notContains': 'does not contain',
    'notEquals': 'does not equal',
    'between': 'between',
    'isTrue': 'is true',
    'isFalse': 'is false',
  },
};

export const PT_LOCALE_TEXT: DataGridLocaleText = {
  toolbarColumns: 'Colunas',
  toolbarFilters: 'Filtros',
  toolbarExport: 'Exportar',
  toolbarSearch: 'Buscar',
  selectedRowsLabel: '{count} selecionado(s)',
  clearSelection: 'Limpar',

  searchTitle: 'Buscar linhas',
  searchPlaceholder: 'Digite para buscar...',
  searchApply: 'Confirmar',
  searchClear: 'Limpar',
  cancel: 'Cancelar',

  columnsTitle: 'Colunas',
  done: 'Concluir',
  searchColumnsPlaceholder: 'Buscar colunas',
  showAll: 'Mostrar todas',
  hideAll: 'Ocultar todas',
  reset: 'Resetar',
  allColumnsVisible: 'Todas as colunas visiveis',
  someColumnsHidden: 'Algumas colunas ocultas',

  filtersTitle: 'Filtros',
  addFilter: 'Adicionar filtro',
  logicAnd: 'E',
  logicOr: 'Ou',
  noFilters: 'Sem filtros.',
  fieldLabel: 'Colunas',
  operatorLabel: 'Operador',
  valueLabel: 'Valor',
  valuePlaceholder: 'Filtrar valor',
  valueBetweenPlaceholder: 'min,max',
  booleanTrueLabel: 'Verdadeiro',
  booleanFalseLabel: 'Falso',
  removeFilter: 'Limpar filtro',

  rowsPerPage: 'Linhas por pagina',
  ofLabel: 'de',
  loadingMoreRows: 'Carregando mais linhas...',
  rowsLoadedLabel: '{count} linhas carregadas',

  emptyLabel: 'Nenhum registro encontrado',
  operatorLabels: {
    'contains': 'contem',
    'doesNotContain': 'nao contem',
    'equals': 'e igual a',
    'doesNotEqual': 'nao e igual a',
    'startsWith': 'comeca com',
    'endsWith': 'termina com',
    'isEmpty': 'esta vazio',
    'isNotEmpty': 'nao esta vazio',
    'isAnyOf': 'e qualquer um dos',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
    'is': 'e',
    'not': 'nao e',
    'before': 'antes de',
    'onOrBefore': 'em ou antes de',
    'after': 'depois de',
    'onOrAfter': 'em ou depois de',
    '=': '=',
    '!=': '!=',
    'notContains': 'nao contem',
    'notEquals': 'nao e igual a',
    'between': 'entre',
    'isTrue': 'e verdadeiro',
    'isFalse': 'e falso',
  },
};

export function resolveLocaleText(
  locale: DataGridLocale = 'en',
  overrides?: Partial<DataGridLocaleText>
): DataGridLocaleText {
  const base = locale === 'pt' ? PT_LOCALE_TEXT : EN_LOCALE_TEXT;

  return {
    ...base,
    ...(overrides ?? {}),
    operatorLabels: {
      ...base.operatorLabels,
      ...(overrides?.operatorLabels ?? {}),
    },
  };
}

export function formatLocale(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (values[key] === undefined) {
      return '';
    }
    return String(values[key]);
  });
}
