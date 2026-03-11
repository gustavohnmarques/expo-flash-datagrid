import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type GridRowId = string;

export type ColumnType =
  | 'string'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'actions'
  | 'custom';

export type SortDirection = 'asc' | 'desc';

export interface SortItem {
  field: string;
  sort: SortDirection;
}

export type SortModel = SortItem[];

export interface FilterItem {
  id?: string;
  field: string;
  operator: string;
  value?: unknown;
}

export interface FilterModel {
  items: FilterItem[];
  logicOperator?: 'and' | 'or';
}

export interface PaginationModel {
  page: number;
  pageSize: number;
}

export type ColumnVisibilityModel = Record<string, boolean>;

export interface QueryState {
  paginationModel: PaginationModel;
  sortModel: SortModel;
  filterModel: FilterModel;
  searchText: string;
  columnVisibilityModel: ColumnVisibilityModel;
  selectionModel: GridRowId[];
}

export interface CellRenderParams<TRow> {
  row: TRow;
  value: unknown;
  rowId: GridRowId;
  field: string;
  rowIndex: number;
  column: ColumnDef<TRow>;
  isSelected: boolean;
}

export interface HeaderRenderParams<TRow> {
  column: ColumnDef<TRow>;
  sortDirection?: SortDirection;
}

export interface FilterOperatorParams<TRow> {
  cellValue: unknown;
  filterValue: unknown;
  row: TRow;
  column: ColumnDef<TRow>;
}

export interface FilterOperator<TRow = unknown> {
  value: string;
  label: string;
  aliases?: string[];
  requiresValue?: boolean;
  inputType?: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'multi';
  apply: (params: FilterOperatorParams<TRow>) => boolean;
}

export interface ColumnDef<TRow> {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  flex?: number;
  type?: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  hideable?: boolean;
  searchable?: boolean;
  valueGetter?: (row: TRow) => unknown;
  valueFormatter?: (value: unknown, row: TRow) => string;
  renderCell?: (params: CellRenderParams<TRow>) => ReactNode;
  renderHeader?: (params: HeaderRenderParams<TRow>) => ReactNode;
  sortComparator?: (a: unknown, b: unknown, rowA: TRow, rowB: TRow) => number;
  filterOperators?: FilterOperator<TRow>[];
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  actions?: GridRowActionsSource<TRow>;
  actionTrigger?: GridActionCellTrigger;
}

export interface DataGridTheme {
  headerBackground?: string;
  headerTextColor?: string;
  rowBackground?: string;
  rowAltBackground?: string;
  rowTextColor?: string;
  borderColor?: string;
  borderRadius?: number;
  dividerColor?: string;
  selectionBackground?: string;
  toolbarBackground?: string;
  toolbarTextColor?: string;
  footerBackground?: string;
  cellPadding?: number;
  headerHeight?: number;
  footerHeight?: number;
}

export interface DataGridSortIcons {
  asc?: ReactNode;
  desc?: ReactNode;
  none?: ReactNode;
}

export type DataGridLocale = 'en' | 'pt';

export interface DataGridLocaleText {
  toolbarColumns: string;
  toolbarFilters: string;
  toolbarExport: string;
  toolbarSearch: string;
  selectedRowsLabel: string; // Use "{count}" placeholder.
  clearSelection: string;

  searchTitle: string;
  searchPlaceholder: string;
  searchApply: string;
  searchClear: string;
  cancel: string;

  columnsTitle: string;
  done: string;
  searchColumnsPlaceholder: string;
  showAll: string;
  hideAll: string;
  reset: string;
  allColumnsVisible: string;
  someColumnsHidden: string;

  filtersTitle: string;
  addFilter: string;
  logicAnd: string;
  logicOr: string;
  noFilters: string;
  fieldLabel: string;
  operatorLabel: string;
  valueLabel: string;
  valuePlaceholder: string;
  valueBetweenPlaceholder: string;
  booleanTrueLabel: string;
  booleanFalseLabel: string;
  removeFilter: string;

  rowsPerPage: string;
  ofLabel: string;
  loadingMoreRows: string;
  rowsLoadedLabel: string; // Use "{count}" placeholder.

  emptyLabel: string;
  operatorLabels: Record<string, string>;
}

export interface CellEventParams<TRow> {
  row: TRow;
  column: ColumnDef<TRow>;
}

export interface GridPressPosition {
  pageX: number;
  pageY: number;
}

export interface RowLongPressParams<TRow> {
  row: TRow;
  rowId: GridRowId;
  position: GridPressPosition;
}

export interface RowActionMenuIconProps {
  color: string;
  size: number;
}

export type GridRowActionIcon =
  | ReactNode
  | ((props: RowActionMenuIconProps) => ReactNode);

export type GridActionDisplayMode = 'icon' | 'label' | 'both';

export interface GridActionCellTrigger {
  icon?: GridRowActionIcon;
  label?: string;
  display?: GridActionDisplayMode;
}

export interface GridRowActionItem<TRow> {
  key: string;
  label?: string;
  icon?: GridRowActionIcon;
  cellLabel?: string;
  displayInCell?: GridActionDisplayMode;
  disabled?: boolean;
  destructive?: boolean;
  onPress: (params: RowLongPressParams<TRow>) => void;
}

export type GridRowActionsSource<TRow> =
  | GridRowActionItem<TRow>[]
  | ((params: RowLongPressParams<TRow>) => GridRowActionItem<TRow>[]);

export interface RowActionMenuOpenParams<TRow>
  extends RowLongPressParams<TRow> {
  actions: GridRowActionItem<TRow>[];
}

export interface FilterOperatorsConfig<TRow> {
  filterOperatorsByType?: Partial<Record<ColumnType, FilterOperator<TRow>[]>>;
  filterOperatorsByField?: Record<string, FilterOperator<TRow>[]>;
}

export interface DataGridProps<TRow> extends FilterOperatorsConfig<TRow> {
  rows: TRow[];
  columns: ColumnDef<TRow>[];
  mode: 'client' | 'server';
  getRowId?: (row: TRow) => string;
  rowHeight?: number;
  estimatedItemSize?: number;
  listMode?: 'auto' | 'flash-list' | 'flat-list';
  getRowStyle?: (row: TRow, index: number) => StyleProp<ViewStyle>;
  zebraRows?: boolean;
  compact?: boolean;
  cardViewBreakpoint?: number;
  style?: StyleProp<ViewStyle>;

  state?: Partial<QueryState>;
  initialState?: Partial<QueryState>;
  onStateChange?: (next: QueryState) => void;
  onQueryChange?: (next: QueryState) => void;

  sortModel?: SortModel;
  onSortModelChange?: (next: SortModel) => void;
  enableMultiSort?: boolean;
  sortIcons?: DataGridSortIcons;
  showUnsortedSortIcon?: boolean;

  filterModel?: FilterModel;
  onFilterModelChange?: (next: FilterModel) => void;
  maxFilters?: number;

  searchText?: string;
  onSearchTextChange?: (next: string) => void;
  searchDebounceMs?: number;

  columnVisibilityModel?: ColumnVisibilityModel;
  onColumnVisibilityModelChange?: (next: ColumnVisibilityModel) => void;

  paginationModel?: PaginationModel;
  onPaginationModelChange?: (next: PaginationModel) => void;
  pageSizeOptions?: number[];
  rowCount?: number;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  infinite?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;

  selectionModel?: GridRowId[];
  onSelectionModelChange?: (next: GridRowId[]) => void;
  checkboxSelection?: boolean;
  toolbarTitle?: ReactNode;
  rowActions?: GridRowActionsSource<TRow>;
  rowActionMenuTrigger?: 'none' | 'longPress';

  onRowPress?: (row: TRow) => void;
  onRowLongPress?: (row: TRow) => void;
  onRowLongPressDetails?: (params: RowLongPressParams<TRow>) => void;
  onRowActionMenuOpen?: (params: RowActionMenuOpenParams<TRow>) => void;
  onCellPress?: (params: CellEventParams<TRow>) => void;
  onCellLongPress?: (params: CellEventParams<TRow>) => void;

  theme?: DataGridTheme;
  locale?: DataGridLocale;
  localeText?: Partial<DataGridLocaleText>;
  emptyLabel?: string;
  emptyState?: ReactNode;
  loadingOverlay?: ReactNode;
  testID?: string;
}

export interface ColumnLayoutItem<TRow> {
  column: ColumnDef<TRow>;
  width: number;
}
