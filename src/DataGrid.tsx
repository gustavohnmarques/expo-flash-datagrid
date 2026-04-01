import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { ColumnMenuModal } from './components/ColumnMenuModal';
import { EmptyState } from './components/EmptyState';
import { FilterPanelModal } from './components/FilterPanelModal';
import { GridHeader } from './components/GridHeader';
import { GridRow } from './components/GridRow';
import { LoadingOverlay } from './components/LoadingOverlay';
import { PaginationFooter } from './components/PaginationFooter';
import { RowActionMenu } from './components/RowActionMenu';
import { SearchModal } from './components/SearchModal';
import { Toolbar } from './components/Toolbar';
import { useColumnLayout } from './hooks/useColumnLayout';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { resolveLocaleText } from './localization/localeText';
import { resolveFooterState } from './utils/footerState';
import { applyClientPipeline } from './utils/pagination';
import { applySearch } from './utils/searching';
import {
  areColumnVisibilityModelsEqual,
  areFilterModelsEqual,
  arePaginationModelsEqual,
  areQueryStatesEqual,
  areSelectionModelsEqual,
  areSortModelsEqual,
} from './utils/stateComparison';
import { isActionColumn, resolveRowActionsSource } from './utils/rowActions';
import type {
  ColumnDef,
  ColumnVisibilityModel,
  DataGridLocaleText,
  DataGridProps,
  DataGridSortIcons,
  DataGridTheme,
  FilterModel,
  GridPressPosition,
  GridRowActionItem,
  GridRowId,
  PaginationModel,
  QueryState,
  RowActionMenuOpenParams,
  RowLongPressParams,
  SortModel,
} from './types';

const DEFAULT_THEME: Required<DataGridTheme> = {
  headerBackground: '#F3F4F6',
  headerTextColor: '#111827',
  rowBackground: '#FFFFFF',
  rowAltBackground: '#F9FAFB',
  rowTextColor: '#111827',
  borderColor: '#D1D5DB',
  borderRadius: 0,
  dividerColor: '#E5E7EB',
  selectionBackground: '#DBEAFE',
  toolbarBackground: '#F9FAFB',
  toolbarTextColor: '#374151',
  footerBackground: '#F9FAFB',
  cellPadding: 10,
  headerHeight: 44,
  footerHeight: 58,
};

const DEFAULT_PAGINATION_MODEL: PaginationModel = {
  page: 0,
  pageSize: 25,
};

const DEFAULT_FILTER_MODEL: FilterModel = {
  items: [],
  logicOperator: 'and',
};

function hasOwn(source: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function clampPagination(model: PaginationModel): PaginationModel {
  const nextPage =
    typeof model.page === 'number' && Number.isFinite(model.page)
      ? model.page
      : DEFAULT_PAGINATION_MODEL.page;
  const nextPageSize =
    typeof model.pageSize === 'number' && Number.isFinite(model.pageSize)
      ? model.pageSize
      : DEFAULT_PAGINATION_MODEL.pageSize;

  return {
    page: Math.max(0, Math.floor(nextPage)),
    pageSize: Math.max(1, Math.floor(nextPageSize)),
  };
}

function toSafeRowCount(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function sanitizePageSizeOptions(
  values: readonly number[],
  fallbackPageSize: number
): number[] {
  const sanitized = values
    .map((value) =>
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(1, Math.floor(value))
        : null
    )
    .filter((value): value is number => value !== null);

  if (sanitized.length) {
    return Array.from(new Set(sanitized));
  }

  return [Math.max(1, Math.floor(fallbackPageSize))];
}

function clampFilterModel(
  model: FilterModel | undefined,
  maxFilters: number
): FilterModel {
  return {
    items: model?.items?.slice(0, maxFilters) ?? [],
    logicOperator: model?.logicOperator ?? 'and',
  };
}

function normalizeQueryState(
  state: Partial<QueryState> | undefined,
  maxFilters: number
): QueryState {
  return {
    paginationModel: clampPagination(
      state?.paginationModel ?? DEFAULT_PAGINATION_MODEL
    ),
    sortModel: state?.sortModel ?? [],
    filterModel: clampFilterModel(state?.filterModel, maxFilters),
    searchText: state?.searchText ?? '',
    columnVisibilityModel: state?.columnVisibilityModel ?? {},
    selectionModel: state?.selectionModel ?? [],
  };
}

function resolveRowIdWithFallback<TRow>(
  row: TRow,
  index: number,
  getRowId?: (row: TRow) => string
): GridRowId {
  if (getRowId) {
    return String(getRowId(row));
  }

  const fallbackId = (row as Record<string, unknown>).id;
  if (fallbackId === null || fallbackId === undefined) {
    return String(index);
  }
  return String(fallbackId);
}

export function DataGrid<TRow>({
  rows,
  columns,
  mode,
  getRowId,
  rowHeight = 44,
  estimatedItemSize: _estimatedItemSize,
  listMode = 'auto',
  getRowStyle,
  zebraRows,
  compact,
  style,
  state,
  initialState,
  onStateChange,
  onQueryChange,
  sortModel: controlledSortModel,
  onSortModelChange,
  enableMultiSort,
  sortIcons,
  showUnsortedSortIcon = false,
  filterModel: controlledFilterModel,
  onFilterModelChange,
  maxFilters = 1,
  searchText: controlledSearchText,
  onSearchTextChange,
  searchDebounceMs = 300,
  serverSearchMode = 'remote',
  serverLocalSearchText: controlledServerLocalSearchText,
  onServerLocalSearchTextChange,
  columnVisibilityModel: controlledColumnVisibilityModel,
  onColumnVisibilityModelChange,
  paginationModel: controlledPaginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10, 25, 50, 100],
  rowCount,
  loading,
  refreshing = false,
  onRefresh,
  infinite,
  onEndReached,
  onEndReachedThreshold = 0.5,
  selectionModel: controlledSelectionModel,
  onSelectionModelChange,
  checkboxSelection = false,
  toolbarTitle,
  rowActions,
  rowActionMenuTrigger,
  onRowPress,
  onRowLongPress,
  onRowLongPressDetails,
  onRowActionMenuOpen,
  onCellPress,
  onCellLongPress,
  filterOperatorsByType,
  filterOperatorsByField,
  theme,
  locale = 'en',
  localeText,
  emptyLabel,
  emptyState,
  loadingOverlay,
  testID,
}: DataGridProps<TRow>) {
  const resolvedMaxFilters = Math.max(1, maxFilters);
  const resolvedListMode =
    listMode === 'auto'
      ? Platform.OS === 'android'
        ? 'flat-list'
        : 'flash-list'
      : listMode;
  const mergedTheme = useMemo<Required<DataGridTheme>>(
    () => ({
      ...DEFAULT_THEME,
      ...(theme ?? {}),
    }),
    [theme]
  );
  const mergedLocaleText = useMemo<DataGridLocaleText>(
    () => resolveLocaleText(locale, localeText),
    [locale, localeText]
  );
  const resolvedEmptyLabel = emptyLabel ?? mergedLocaleText.emptyLabel;
  const resolvedSortIcons = useMemo<DataGridSortIcons | undefined>(
    () => sortIcons,
    [sortIcons]
  );
  const resolvedPageSizeOptions = useMemo(
    () =>
      sanitizePageSizeOptions(
        pageSizeOptions,
        controlledPaginationModel?.pageSize ??
          state?.paginationModel?.pageSize ??
          initialState?.paginationModel?.pageSize ??
          DEFAULT_PAGINATION_MODEL.pageSize
      ),
    [
      controlledPaginationModel?.pageSize,
      initialState?.paginationModel?.pageSize,
      pageSizeOptions,
      state?.paginationModel?.pageSize,
    ]
  );

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowWidth);
  const [isColumnMenuVisible, setIsColumnMenuVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [activeLongPressRowId, setActiveLongPressRowId] =
    useState<GridRowId | null>(null);
  const [rowActionMenuState, setRowActionMenuState] =
    useState<RowActionMenuOpenParams<TRow> | null>(null);

  const initialQueryStateRef = useRef<QueryState>(
    normalizeQueryState(initialState, resolvedMaxFilters)
  );
  const [internalState, setInternalState] = useState<QueryState>(
    initialQueryStateRef.current
  );

  const controlledState = useMemo(() => state ?? {}, [state]);
  const resolvedState = useMemo(() => {
    const nextState: Partial<QueryState> = {
      ...internalState,
      ...controlledState,
    };

    if (controlledPaginationModel) {
      nextState.paginationModel = controlledPaginationModel;
    }
    if (controlledSortModel) {
      nextState.sortModel = controlledSortModel;
    }
    if (controlledFilterModel) {
      nextState.filterModel = controlledFilterModel;
    }
    if (controlledSearchText !== undefined) {
      nextState.searchText = controlledSearchText;
    }
    if (controlledColumnVisibilityModel) {
      nextState.columnVisibilityModel = controlledColumnVisibilityModel;
    }
    if (controlledSelectionModel) {
      nextState.selectionModel = controlledSelectionModel;
    }

    return normalizeQueryState(nextState, resolvedMaxFilters);
  }, [
    controlledColumnVisibilityModel,
    controlledFilterModel,
    controlledPaginationModel,
    controlledSearchText,
    controlledSelectionModel,
    controlledSortModel,
    controlledState,
    internalState,
    resolvedMaxFilters,
  ]);
  const resolvedStateRef = useRef<QueryState>(resolvedState);
  resolvedStateRef.current = resolvedState;
  const [internalServerLocalSearchText, setInternalServerLocalSearchText] =
    useState(controlledServerLocalSearchText ?? '');
  const isServerLocalSearchControlled =
    controlledServerLocalSearchText !== undefined;
  const resolvedServerLocalSearchText =
    controlledServerLocalSearchText ?? internalServerLocalSearchText;
  const isServerLocalSearchEnabled =
    mode === 'server' && serverSearchMode === 'localRows';
  const effectiveSearchText = isServerLocalSearchEnabled
    ? resolvedServerLocalSearchText
    : resolvedState.searchText;
  const hasActiveSearch = Boolean(effectiveSearchText.trim());

  const isPaginationControlled =
    controlledPaginationModel !== undefined ||
    hasOwn(controlledState, 'paginationModel');
  const isSortControlled =
    controlledSortModel !== undefined || hasOwn(controlledState, 'sortModel');
  const isFilterControlled =
    controlledFilterModel !== undefined ||
    hasOwn(controlledState, 'filterModel');
  const isSearchControlled =
    controlledSearchText !== undefined || hasOwn(controlledState, 'searchText');
  const isVisibilityControlled =
    controlledColumnVisibilityModel !== undefined ||
    hasOwn(controlledState, 'columnVisibilityModel');
  const isSelectionControlled =
    controlledSelectionModel !== undefined ||
    hasOwn(controlledState, 'selectionModel');

  const emitQueryStateChange = useCallback(
    (nextState: QueryState) => {
      onStateChange?.(nextState);
      onQueryChange?.(nextState);
    },
    [onQueryChange, onStateChange]
  );

  const updateQueryState = useCallback(
    (partialState: Partial<QueryState>) => {
      const currentState = resolvedStateRef.current;
      const nextState = normalizeQueryState(
        {
          ...currentState,
          ...partialState,
        },
        resolvedMaxFilters
      );

      const paginationChanged =
        partialState.paginationModel !== undefined &&
        !arePaginationModelsEqual(
          currentState.paginationModel,
          nextState.paginationModel
        );
      const sortChanged =
        partialState.sortModel !== undefined &&
        !areSortModelsEqual(currentState.sortModel, nextState.sortModel);
      const filterChanged =
        partialState.filterModel !== undefined &&
        !areFilterModelsEqual(currentState.filterModel, nextState.filterModel);
      const searchChanged =
        partialState.searchText !== undefined &&
        currentState.searchText !== nextState.searchText;
      const visibilityChanged =
        partialState.columnVisibilityModel !== undefined &&
        !areColumnVisibilityModelsEqual(
          currentState.columnVisibilityModel,
          nextState.columnVisibilityModel
        );
      const selectionChanged =
        partialState.selectionModel !== undefined &&
        !areSelectionModelsEqual(
          currentState.selectionModel,
          nextState.selectionModel
        );

      if (
        !paginationChanged &&
        !sortChanged &&
        !filterChanged &&
        !searchChanged &&
        !visibilityChanged &&
        !selectionChanged
      ) {
        return;
      }

      if (
        (!isPaginationControlled && paginationChanged) ||
        (!isSortControlled && sortChanged) ||
        (!isFilterControlled && filterChanged) ||
        (!isSearchControlled && searchChanged) ||
        (!isVisibilityControlled && visibilityChanged) ||
        (!isSelectionControlled && selectionChanged)
      ) {
        setInternalState((previous) => {
          const nextInternalState: QueryState = { ...previous };

          if (!isPaginationControlled && paginationChanged) {
            nextInternalState.paginationModel = nextState.paginationModel;
          }
          if (!isSortControlled && sortChanged) {
            nextInternalState.sortModel = nextState.sortModel;
          }
          if (!isFilterControlled && filterChanged) {
            nextInternalState.filterModel = nextState.filterModel;
          }
          if (!isSearchControlled && searchChanged) {
            nextInternalState.searchText = nextState.searchText;
          }
          if (!isVisibilityControlled && visibilityChanged) {
            nextInternalState.columnVisibilityModel =
              nextState.columnVisibilityModel;
          }
          if (!isSelectionControlled && selectionChanged) {
            nextInternalState.selectionModel = nextState.selectionModel;
          }

          return areQueryStatesEqual(previous, nextInternalState)
            ? previous
            : nextInternalState;
        });
      }

      if (paginationChanged) {
        onPaginationModelChange?.(nextState.paginationModel);
      }
      if (sortChanged) {
        onSortModelChange?.(nextState.sortModel);
      }
      if (filterChanged) {
        onFilterModelChange?.(nextState.filterModel);
      }
      if (searchChanged) {
        onSearchTextChange?.(nextState.searchText);
      }
      if (visibilityChanged) {
        onColumnVisibilityModelChange?.(nextState.columnVisibilityModel);
      }
      if (selectionChanged) {
        onSelectionModelChange?.(nextState.selectionModel);
      }

      emitQueryStateChange(nextState);
    },
    [
      emitQueryStateChange,
      isFilterControlled,
      isPaginationControlled,
      isSearchControlled,
      isSelectionControlled,
      isSortControlled,
      isVisibilityControlled,
      onColumnVisibilityModelChange,
      onFilterModelChange,
      onPaginationModelChange,
      onSearchTextChange,
      onSelectionModelChange,
      onSortModelChange,
      resolvedMaxFilters,
    ]
  );

  useEffect(() => {
    if (controlledServerLocalSearchText === undefined) {
      return;
    }

    setInternalServerLocalSearchText((previous) =>
      previous === controlledServerLocalSearchText
        ? previous
        : controlledServerLocalSearchText
    );
  }, [controlledServerLocalSearchText]);

  const [searchDraft, setSearchDraft] = useState(effectiveSearchText);
  useEffect(() => {
    setSearchDraft((previous) =>
      previous === effectiveSearchText ? previous : effectiveSearchText
    );
  }, [effectiveSearchText]);

  const debouncedSearchText = useDebouncedValue(searchDraft, searchDebounceMs);

  const commitSearchText = useCallback(
    (nextSearchText: string) => {
      if (isServerLocalSearchEnabled) {
        if (!isServerLocalSearchControlled) {
          setInternalServerLocalSearchText((previous) =>
            previous === nextSearchText ? previous : nextSearchText
          );
        }

        onServerLocalSearchTextChange?.(nextSearchText);
        return;
      }

      const { paginationModel } = resolvedStateRef.current;
      updateQueryState({
        searchText: nextSearchText,
        paginationModel: {
          ...paginationModel,
          page: 0,
        },
      });
    },
    [
      isServerLocalSearchControlled,
      isServerLocalSearchEnabled,
      onServerLocalSearchTextChange,
      updateQueryState,
    ]
  );

  useEffect(() => {
    if (isSearchModalVisible) {
      return;
    }

    if (debouncedSearchText === effectiveSearchText) {
      return;
    }

    commitSearchText(debouncedSearchText);
  }, [
    commitSearchText,
    debouncedSearchText,
    effectiveSearchText,
    isSearchModalVisible,
  ]);

  useEffect(() => {
    if (!resolvedState.selectionModel.length) {
      setSelectionMode((previous) => (previous ? false : previous));
    }
  }, [resolvedState.selectionModel.length]);

  const onGridLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      const nextWidth = Math.max(1, Math.floor(event.nativeEvent.layout.width));
      setContainerWidth((previous) =>
        previous === nextWidth ? previous : nextWidth
      );
    },
    []
  );

  const selectionColumnWidth = checkboxSelection === true ? 42 : 0;
  const { visibleColumns, totalWidth } = useColumnLayout({
    columns,
    columnVisibilityModel: resolvedState.columnVisibilityModel,
    containerWidth: Math.max(containerWidth - selectionColumnWidth, 1),
  });

  const resolvedSortModel = useMemo<SortModel>(() => {
    if (enableMultiSort) {
      return resolvedState.sortModel;
    }

    return resolvedState.sortModel.slice(0, 1);
  }, [enableMultiSort, resolvedState.sortModel]);
  const safeServerRowCount = useMemo(
    () => toSafeRowCount(rowCount, rows.length),
    [rowCount, rows.length]
  );
  const serverRowsAfterSearch = useMemo(() => {
    if (!isServerLocalSearchEnabled) {
      return rows;
    }

    return applySearch(rows, columns, resolvedServerLocalSearchText);
  }, [
    columns,
    isServerLocalSearchEnabled,
    resolvedServerLocalSearchText,
    rows,
  ]);
  const serverLocalSearchActive = isServerLocalSearchEnabled && hasActiveSearch;

  const pipeline = useMemo(() => {
    if (mode === 'server') {
      return {
        sortedRows: serverRowsAfterSearch,
        paginatedRows: serverRowsAfterSearch,
        totalRows: safeServerRowCount,
      };
    }

    const result = applyClientPipeline({
      rows,
      columns,
      sortModel: resolvedSortModel,
      filterModel: resolvedState.filterModel,
      searchText: resolvedState.searchText,
      paginationModel: resolvedState.paginationModel,
      filterOperatorsByType,
      filterOperatorsByField,
    });

    return {
      sortedRows: result.sortedRows,
      paginatedRows: result.paginatedRows,
      totalRows: result.sortedRows.length,
    };
  }, [
    columns,
    filterOperatorsByField,
    filterOperatorsByType,
    mode,
    resolvedSortModel,
    resolvedState.filterModel,
    resolvedState.paginationModel,
    resolvedState.searchText,
    rows,
    safeServerRowCount,
    serverRowsAfterSearch,
  ]);

  const displayRows = infinite ? pipeline.sortedRows : pipeline.paginatedRows;
  const resolvedRowCount =
    mode === 'server' ? safeServerRowCount : pipeline.totalRows;
  const footerState = useMemo(
    () =>
      resolveFooterState({
        paginationModel: resolvedState.paginationModel,
        localRowCount: serverRowsAfterSearch.length,
        localSearchActive: mode === 'server' && serverLocalSearchActive,
        infinite,
      }),
    [
      infinite,
      mode,
      resolvedState.paginationModel,
      serverLocalSearchActive,
      serverRowsAfterSearch.length,
    ]
  );
  const shouldShowEmptyState = !loading && displayRows.length === 0;
  const hasActiveColumns = useMemo(
    () =>
      columns.some(
        (column) =>
          column.hideable !== false &&
          resolvedState.columnVisibilityModel[column.field] === false
      ),
    [columns, resolvedState.columnVisibilityModel]
  );

  const selectedIdSet = useMemo(
    () => new Set(resolvedState.selectionModel),
    [resolvedState.selectionModel]
  );
  const isSelectionInteractionEnabled =
    selectionMode || checkboxSelection === true;
  const resolvedRowActionMenuTrigger =
    rowActions == null ? 'none' : rowActionMenuTrigger ?? 'longPress';

  const toggleSelection = useCallback(
    (rowId: GridRowId) => {
      const currentSelection = resolvedStateRef.current.selectionModel;
      const isAlreadySelected = currentSelection.includes(rowId);
      const nextSelection = isAlreadySelected
        ? currentSelection.filter((id) => id !== rowId)
        : [...currentSelection, rowId];

      updateQueryState({
        selectionModel: nextSelection,
      });
    },
    [updateQueryState]
  );

  const resolveRowId = useCallback(
    (row: TRow, index: number) =>
      resolveRowIdWithFallback(row, index, getRowId),
    [getRowId]
  );

  const resolveRowActions = useCallback(
    (params: RowLongPressParams<TRow>): GridRowActionItem<TRow>[] => {
      return resolveRowActionsSource(rowActions, params);
    },
    [rowActions]
  );

  const openRowActionMenu = useCallback(
    (params: RowLongPressParams<TRow>, actions: GridRowActionItem<TRow>[]) => {
      if (!actions.length) {
        return;
      }

      const menuState: RowActionMenuOpenParams<TRow> = {
        ...params,
        actions,
      };
      setRowActionMenuState(menuState);
      onRowActionMenuOpen?.(menuState);
    },
    [onRowActionMenuOpen]
  );

  const handleRowPress = useCallback(
    (row: TRow, rowId: GridRowId) => {
      setActiveLongPressRowId((previous) =>
        previous === rowId ? null : previous
      );
      if (isSelectionInteractionEnabled) {
        toggleSelection(rowId);
        return;
      }
      onRowPress?.(row);
    },
    [isSelectionInteractionEnabled, onRowPress, toggleSelection]
  );

  const handleRowLongPress = useCallback(
    (
      row: TRow,
      rowId: GridRowId,
      event: { nativeEvent: { pageX: number; pageY: number } }
    ) => {
      setActiveLongPressRowId(rowId);
      const position: GridPressPosition = {
        pageX: event.nativeEvent.pageX,
        pageY: event.nativeEvent.pageY,
      };
      const longPressParams: RowLongPressParams<TRow> = {
        position,
        row,
        rowId,
      };
      const actions = resolveRowActions(longPressParams);

      onRowLongPressDetails?.(longPressParams);

      if (resolvedRowActionMenuTrigger === 'longPress' && actions.length > 0) {
        openRowActionMenu(longPressParams, actions);
        onRowLongPress?.(row);
        return;
      }

      setSelectionMode(true);
      toggleSelection(rowId);
      setActiveLongPressRowId(null);
      onRowLongPress?.(row);
    },
    [
      onRowLongPress,
      onRowLongPressDetails,
      resolveRowActions,
      resolvedRowActionMenuTrigger,
      toggleSelection,
      openRowActionMenu,
    ]
  );

  const handleCellPress = useCallback(
    (row: TRow, rowId: GridRowId, column: ColumnDef<TRow>) => {
      onCellPress?.({ row, column });
      handleRowPress(row, rowId);
    },
    [handleRowPress, onCellPress]
  );

  const handleCellLongPress = useCallback(
    (
      row: TRow,
      rowId: GridRowId,
      column: ColumnDef<TRow>,
      event: { nativeEvent: { pageX: number; pageY: number } }
    ) => {
      onCellLongPress?.({ row, column });
      handleRowLongPress(row, rowId, event);
    },
    [handleRowLongPress, onCellLongPress]
  );

  const handleActionCellPress = useCallback(
    (
      row: TRow,
      rowId: GridRowId,
      column: ColumnDef<TRow>,
      event: GestureResponderEvent
    ) => {
      if (!isActionColumn(column)) {
        return;
      }

      const actionParams: RowLongPressParams<TRow> = {
        position: {
          pageX: event.nativeEvent.pageX,
          pageY: event.nativeEvent.pageY,
        },
        row,
        rowId,
      };
      const actions = resolveRowActionsSource(column.actions, actionParams);

      if (!actions.length) {
        return;
      }

      setActiveLongPressRowId(rowId);

      openRowActionMenu(actionParams, actions);
    },
    [openRowActionMenu]
  );

  const handleSortPress = useCallback(
    (field: string) => {
      const currentState = resolvedStateRef.current;
      const currentSortModel = enableMultiSort
        ? currentState.sortModel
        : currentState.sortModel.slice(0, 1);
      const previousItem = resolvedSortModel.find(
        (item) => item.field === field
      );
      const nextDirection =
        previousItem?.sort === 'asc'
          ? 'desc'
          : previousItem?.sort === 'desc'
          ? undefined
          : 'asc';

      let nextSortModel: SortModel;
      if (!nextDirection) {
        nextSortModel = currentSortModel.filter((item) => item.field !== field);
      } else if (!enableMultiSort) {
        nextSortModel = [{ field, sort: nextDirection }];
      } else if (previousItem) {
        nextSortModel = currentSortModel.map((item) =>
          item.field === field ? { ...item, sort: nextDirection } : item
        );
      } else {
        nextSortModel = [...currentSortModel, { field, sort: nextDirection }];
      }

      updateQueryState({
        sortModel: nextSortModel,
        paginationModel: {
          ...currentState.paginationModel,
          page: 0,
        },
      });
    },
    [enableMultiSort, resolvedSortModel, updateQueryState]
  );

  const handleFilterModelChange = useCallback(
    (nextFilterModel: FilterModel) => {
      const { paginationModel } = resolvedStateRef.current;
      updateQueryState({
        filterModel: clampFilterModel(nextFilterModel, resolvedMaxFilters),
        paginationModel: {
          ...paginationModel,
          page: 0,
        },
      });
    },
    [resolvedMaxFilters, updateQueryState]
  );

  const handlePaginationModelChange = useCallback(
    (nextPaginationModel: PaginationModel) => {
      updateQueryState({
        paginationModel: clampPagination(nextPaginationModel),
      });
    },
    [updateQueryState]
  );

  const handleVisibilityChange = useCallback(
    (nextVisibilityModel: ColumnVisibilityModel) => {
      updateQueryState({
        columnVisibilityModel: nextVisibilityModel,
      });
    },
    [updateQueryState]
  );

  const handleClearSelection = useCallback(() => {
    updateQueryState({
      selectionModel: [],
    });
  }, [updateQueryState]);

  const handleClearFilters = useCallback(() => {
    const { columnVisibilityModel, filterModel, paginationModel, searchText } =
      resolvedStateRef.current;
    const hasRemoteHiddenColumns = Object.values(columnVisibilityModel).some(
      (isVisible) => isVisible === false
    );
    const hasLocalSearch =
      isServerLocalSearchEnabled &&
      Boolean(resolvedServerLocalSearchText.trim());
    const shouldResetRemoteQuery =
      Boolean(searchText.trim()) ||
      filterModel.items.length > 0 ||
      hasRemoteHiddenColumns;

    setSearchDraft('');
    if (hasLocalSearch) {
      commitSearchText('');
    }

    if (!shouldResetRemoteQuery) {
      return;
    }

    updateQueryState({
      searchText: '',
      filterModel: DEFAULT_FILTER_MODEL,
      columnVisibilityModel: {},
      paginationModel: {
        ...paginationModel,
        page: 0,
      },
    });
  }, [
    commitSearchText,
    isServerLocalSearchEnabled,
    resolvedServerLocalSearchText,
    updateQueryState,
  ]);

  const renderRow = useCallback(
    ({ item, index }: { item: TRow; index: number }) => {
      const rowId = resolveRowId(item, index);
      return (
        <GridRow
          row={item}
          rowId={rowId}
          rowIndex={index}
          columns={visibleColumns}
          rowHeight={compact ? Math.max(34, rowHeight - 8) : rowHeight}
          rowBackground={mergedTheme.rowBackground}
          rowAltBackground={mergedTheme.rowAltBackground}
          rowTextColor={mergedTheme.rowTextColor}
          dividerColor={mergedTheme.dividerColor}
          selectionBackground={mergedTheme.selectionBackground}
          zebraRows={zebraRows}
          getRowStyle={getRowStyle}
          isContextActive={activeLongPressRowId === rowId}
          isSelected={selectedIdSet.has(rowId)}
          checkboxSelection={checkboxSelection}
          onToggleSelection={toggleSelection}
          onRowPress={handleRowPress}
          onRowLongPress={handleRowLongPress}
          onCellPress={handleCellPress}
          onCellLongPress={handleCellLongPress}
          onActionCellPress={handleActionCellPress}
          cellPadding={mergedTheme.cellPadding}
        />
      );
    },
    [
      checkboxSelection,
      compact,
      getRowStyle,
      handleCellLongPress,
      handleCellPress,
      handleActionCellPress,
      handleRowLongPress,
      handleRowPress,
      mergedTheme.cellPadding,
      mergedTheme.dividerColor,
      mergedTheme.rowAltBackground,
      mergedTheme.rowBackground,
      mergedTheme.rowTextColor,
      mergedTheme.selectionBackground,
      resolveRowId,
      rowHeight,
      selectedIdSet,
      toggleSelection,
      visibleColumns,
      zebraRows,
      activeLongPressRowId,
    ]
  );

  const keyExtractor = useCallback(
    (item: TRow, index: number) => resolveRowId(item, index),
    [resolveRowId]
  );

  const renderEmptyState = useCallback(
    () =>
      emptyState == null ? (
        <EmptyState label={resolvedEmptyLabel} />
      ) : (
        <>{emptyState}</>
      ),
    [emptyState, resolvedEmptyLabel]
  );

  const handleApplySearch = useCallback(() => {
    commitSearchText(searchDraft);
    setIsSearchModalVisible(false);
  }, [commitSearchText, searchDraft]);

  const handleCloseSearchModal = useCallback(() => {
    const nextSearchText = isServerLocalSearchEnabled
      ? controlledServerLocalSearchText ?? internalServerLocalSearchText
      : resolvedStateRef.current.searchText;

    setSearchDraft(nextSearchText);
    setIsSearchModalVisible(false);
  }, [
    controlledServerLocalSearchText,
    internalServerLocalSearchText,
    isServerLocalSearchEnabled,
  ]);

  const handleClearSearch = useCallback(() => {
    setSearchDraft('');
  }, []);

  const listProps = useMemo(
    () => ({
      data: displayRows,
      extraData: resolvedState.selectionModel,
      keyExtractor,
      nestedScrollEnabled: true,
      onEndReached: infinite ? onEndReached : undefined,
      onEndReachedThreshold,
      onRefresh,
      refreshing: onRefresh ? refreshing : false,
      renderItem: renderRow,
      showsVerticalScrollIndicator: true,
    }),
    [
      displayRows,
      infinite,
      keyExtractor,
      onEndReached,
      onEndReachedThreshold,
      onRefresh,
      refreshing,
      renderRow,
      resolvedState.selectionModel,
    ]
  );

  return (
    <View
      testID={testID}
      style={[styles.container, style]}
      onLayout={onGridLayout}
    >
      <Toolbar
        backgroundColor={mergedTheme.toolbarBackground}
        borderColor={mergedTheme.borderColor}
        textColor={mergedTheme.toolbarTextColor}
        localeText={mergedLocaleText}
        hasActiveColumns={hasActiveColumns}
        hasActiveSearch={hasActiveSearch}
        hasActiveFilters={resolvedState.filterModel.items.length > 0}
        title={toolbarTitle}
        onClearFilters={handleClearFilters}
        onOpenSearch={() => setIsSearchModalVisible(true)}
        onOpenFilters={() => setIsFilterModalVisible(true)}
        onOpenColumns={() => setIsColumnMenuVisible(true)}
        selectionCount={resolvedState.selectionModel.length}
        onClearSelection={handleClearSelection}
      />

      <View
        style={[
          styles.gridSurface,
          {
            borderColor: mergedTheme.borderColor,
            borderRadius: mergedTheme.borderRadius,
          },
        ]}
      >
        <ScrollView
          horizontal
          contentContainerStyle={styles.horizontalContent}
          directionalLockEnabled
          showsHorizontalScrollIndicator
          style={styles.horizontalScroll}
        >
          <View style={{ width: totalWidth + selectionColumnWidth }}>
            <GridHeader
              columns={visibleColumns}
              sortModel={resolvedSortModel}
              onSortPress={handleSortPress}
              headerHeight={mergedTheme.headerHeight}
              headerBackground={mergedTheme.headerBackground}
              headerTextColor={mergedTheme.headerTextColor}
              borderColor={mergedTheme.borderColor}
              dividerColor={mergedTheme.dividerColor}
              cellPadding={mergedTheme.cellPadding}
              checkboxSelection={checkboxSelection}
              sortIcons={resolvedSortIcons}
              showUnsortedSortIcon={showUnsortedSortIcon}
            />

            <View style={styles.listContainer}>
              {resolvedListMode === 'flash-list' ? (
                <FlashList {...listProps} />
              ) : (
                <FlatList {...listProps} />
              )}
            </View>
          </View>
        </ScrollView>

        {shouldShowEmptyState ? (
          <View
            pointerEvents={emptyState == null ? 'none' : 'box-none'}
            style={[
              styles.emptyStateOverlay,
              {
                bottom: mergedTheme.footerHeight,
                top: mergedTheme.headerHeight,
              },
            ]}
          >
            <View style={styles.emptyStateContent}>{renderEmptyState()}</View>
          </View>
        ) : null}

        <PaginationFooter
          paginationModel={resolvedState.paginationModel}
          pageSizeOptions={resolvedPageSizeOptions}
          rowCount={resolvedRowCount}
          rangePaginationModel={footerState.rangePaginationModel}
          rangeRowCount={footerState.rangeRowCount}
          footerHeight={mergedTheme.footerHeight}
          footerBackground={mergedTheme.footerBackground}
          borderColor={mergedTheme.borderColor}
          localeText={mergedLocaleText}
          loading={loading}
          infinite={infinite}
          onPaginationModelChange={handlePaginationModelChange}
        />

        {loading ? loadingOverlay ?? <LoadingOverlay /> : null}
      </View>

      <SearchModal
        visible={isSearchModalVisible}
        value={searchDraft}
        localeText={mergedLocaleText}
        onChange={setSearchDraft}
        onApply={handleApplySearch}
        onClear={handleClearSearch}
        onClose={handleCloseSearchModal}
      />

      <ColumnMenuModal
        visible={isColumnMenuVisible}
        columns={columns}
        model={resolvedState.columnVisibilityModel}
        localeText={mergedLocaleText}
        onChange={handleVisibilityChange}
        onClose={() => setIsColumnMenuVisible(false)}
      />

      <FilterPanelModal
        visible={isFilterModalVisible}
        columns={columns}
        model={resolvedState.filterModel ?? DEFAULT_FILTER_MODEL}
        localeText={mergedLocaleText}
        onChange={handleFilterModelChange}
        filterOperatorsByType={filterOperatorsByType}
        filterOperatorsByField={filterOperatorsByField}
        maxFilters={resolvedMaxFilters}
        onClose={() => setIsFilterModalVisible(false)}
      />

      <RowActionMenu
        anchor={rowActionMenuState?.position ?? null}
        items={
          rowActionMenuState?.actions.map((action) => ({
            ...action,
            onPress: () => {
              action.onPress({
                position: rowActionMenuState.position,
                row: rowActionMenuState.row,
                rowId: rowActionMenuState.rowId,
              });
              setActiveLongPressRowId(null);
              setRowActionMenuState(null);
            },
          })) ?? []
        }
        visible={rowActionMenuState !== null}
        onClose={() => {
          setActiveLongPressRowId(null);
          setRowActionMenuState(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    width: '100%',
  },
  gridSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    overflow: 'hidden',
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalContent: {
    flexGrow: 1,
  },
  listContainer: {
    flex: 1,
    minHeight: 180,
  },
  emptyStateOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    paddingHorizontal: 24,
  },
});
