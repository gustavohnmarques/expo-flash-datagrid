# expo-flash-datagrid

React Native data grid and Expo data table built on top of FlashList, with virtualization, sorting, filtering, global search, pagination, row selection, row actions, and localization.

`expo-flash-datagrid` is designed for apps that need a more capable table than `FlatList`, while still keeping React Native ergonomics and strong TypeScript support.

If you are looking for a React Native data table, Expo data grid, mobile datagrid, or a FlashList-based grid component, this package is built for that use case.

## What It Is

This package focuses on mobile-first tabular data experiences for Expo and React Native apps:

- CRM and admin lists
- inventory and catalog screens
- financial and operational tables
- searchable and filterable mobile datasets
- server-driven tables with pagination or infinite loading

## Current Status

Expo-only for now.

The package currently depends on `@expo/vector-icons`, `expo-font`, and `@react-native-community/datetimepicker`, so it is intended for Expo projects at the moment. A bare React Native version would require replacing that dependency chain first.

## Features

- FlashList-powered rendering for large datasets
- Client and server data modes
- Sorting, filtering, global search, pagination, and infinite loading
- Column visibility management
- Selection model with mobile-oriented long-press behavior
- Row action menus and actions columns
- Theme overrides and locale overrides
- Built-in English and Portuguese locale bundles
- Exported pure utilities for sorting, filtering, search, and pagination

## Why This Package

- Better fit than a plain `FlatList` when you need real table behavior on mobile
- Strong TypeScript API for rows, columns, filters, pagination, and events
- Familiar data-grid concepts inspired by desktop grids, adapted to touch-first UX
- Good fit for Expo apps that need an MUI-like data grid experience in React Native

## Installation

This package currently expects an Expo-compatible setup because it uses `@expo/vector-icons` internally and safe-area aware modal surfaces.

If you already have an Expo app, `react`, `react-native`, `expo`, and `expo-font` are usually already present.

### npm

```sh
npm install expo-flash-datagrid @shopify/flash-list react-native-safe-area-context @expo/vector-icons @react-native-community/datetimepicker expo expo-font
```

### yarn

```sh
yarn add expo-flash-datagrid @shopify/flash-list react-native-safe-area-context @expo/vector-icons @react-native-community/datetimepicker expo expo-font
```

Required peers in the host app:

- `react`
- `react-native`
- `expo`
- `expo-font`
- `@expo/vector-icons`
- `@react-native-community/datetimepicker`
- `@shopify/flash-list`
- `react-native-safe-area-context`

Wrap your app with `SafeAreaProvider`:

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <YourScreen />
    </SafeAreaProvider>
  );
}
```

## Quick Start

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { DataGrid, type ColumnDef, type QueryState } from 'expo-flash-datagrid';

type User = {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
};

const rows: User[] = [
  {
    id: '1',
    name: 'Alice',
    email: 'alice@company.com',
    age: 29,
    active: true,
  },
  {
    id: '2',
    name: 'Bruno',
    email: 'bruno@company.com',
    age: 34,
    active: false,
  },
];

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'email', headerName: 'Email', flex: 1.2 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
  { field: 'active', headerName: 'Active', type: 'boolean', width: 90 },
];

const initialState: QueryState = {
  paginationModel: { page: 0, pageSize: 25 },
  sortModel: [],
  filterModel: { items: [], logicOperator: 'and' },
  searchText: '',
  columnVisibilityModel: {},
  selectionModel: [],
};

export function UsersScreen() {
  const [state, setState] = useState<QueryState>(initialState);

  return (
    <View style={{ flex: 1 }}>
      <DataGrid<User>
        mode="client"
        rows={rows}
        columns={columns}
        state={state}
        onStateChange={setState}
        checkboxSelection
        zebraRows
        pageSizeOptions={[10, 25, 50]}
        style={{ flex: 1 }}
      />
    </View>
  );
}
```

## Data Modes

### Client mode

In `client` mode, the grid applies these steps locally on `rows`:

1. Filter
2. Search
3. Sort
4. Paginate

Use this mode when the full dataset is already available in memory.

```tsx
<DataGrid<User>
  mode="client"
  rows={rows}
  columns={columns}
  state={state}
  onStateChange={setState}
  enableMultiSort
  searchDebounceMs={300}
  pageSizeOptions={[10, 25, 50]}
/>
```

### Server mode

In `server` mode, the grid does not transform rows locally. It emits state changes and you fetch the correct slice from your API.

```tsx
import { useEffect, useState } from 'react';
import { DataGrid, type QueryState } from 'expo-flash-datagrid';

const initialState: QueryState = {
  paginationModel: { page: 0, pageSize: 25 },
  sortModel: [],
  filterModel: { items: [], logicOperator: 'and' },
  searchText: '',
  columnVisibilityModel: {},
  selectionModel: [],
};

export function ServerUsersScreen() {
  const [state, setState] = useState<QueryState>(initialState);
  const [rows, setRows] = useState<User[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Call your API using:
    // state.paginationModel
    // state.sortModel
    // state.filterModel
    // state.searchText
    //
    // Then update rows and rowCount.

    setLoading(false);
  }, [state]);

  return (
    <DataGrid<User>
      mode="server"
      rows={rows}
      columns={columns}
      rowCount={rowCount}
      state={state}
      onStateChange={setState}
      loading={loading}
    />
  );
}
```

### Server mode with local toolbar search

Some server-driven screens need column filters and sorting to stay on the API, while the search icon should only filter the rows that have already been returned.

Use `serverSearchMode="localRows"` for that hybrid behavior:

- column filters stay server-side
- sorting stays server-side
- the toolbar search filters only the current `rows`
- `searchText` remains available for remote search flows
- `serverLocalSearchText` controls the local toolbar search when you need it

```tsx
import { useEffect, useState } from 'react';
import {
  DataGrid,
  applyFilter,
  applySearch,
  applySorting,
  type QueryState,
  type ServerSearchMode,
} from 'expo-flash-datagrid';

const initialState: QueryState = {
  paginationModel: { page: 0, pageSize: 25 },
  sortModel: [],
  filterModel: { items: [], logicOperator: 'and' },
  searchText: '',
  columnVisibilityModel: {},
  selectionModel: [],
};

export function HybridServerUsersScreen() {
  const [state, setState] = useState<QueryState>(initialState);
  const [rows, setRows] = useState<User[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverSearchMode, setServerSearchMode] =
    useState<ServerSearchMode>('localRows');
  const [serverLocalSearchText, setServerLocalSearchText] = useState('');

  useEffect(() => {
    setLoading(true);

    const remotelyFiltered = applyFilter(ALL_USERS, columns, state.filterModel);
    const remotelySearched = applySearch(
      remotelyFiltered,
      columns,
      serverSearchMode === 'remote' ? state.searchText : ''
    );
    const remotelySorted = applySorting(
      remotelySearched,
      columns,
      state.sortModel
    );

    const from = state.paginationModel.page * state.paginationModel.pageSize;
    const to = from + state.paginationModel.pageSize;

    setRows(remotelySorted.slice(from, to));
    setRowCount(remotelySorted.length);
    setLoading(false);
  }, [columns, serverSearchMode, state]);

  return (
    <DataGrid<User>
      mode="server"
      rows={rows}
      columns={columns}
      rowCount={rowCount}
      state={state}
      onStateChange={setState}
      loading={loading}
      serverSearchMode={serverSearchMode}
      serverLocalSearchText={serverLocalSearchText}
      onServerLocalSearchTextChange={setServerLocalSearchText}
    />
  );
}
```

When `serverSearchMode="localRows"` and the toolbar search has text:

- paged server mode shows the local match count in the footer range while keeping page navigation based on the remote `rowCount`
- infinite mode shows the local match count for the loaded rows currently in memory
- the local search does not emit a new remote query by itself

## Common Customizations

### Empty state and localization

The grid ships with `en` and `pt` locale bundles. You can override the empty-state text directly with `emptyLabel` or provide a partial `localeText`.

```tsx
<DataGrid<User>
  mode="client"
  rows={rows}
  columns={columns}
  locale="pt"
  emptyLabel="Nenhum cliente encontrado"
  localeText={{
    rowsPerPage: 'Itens por página',
  }}
/>
```

Exported helpers:

- `EN_LOCALE_TEXT`
- `PT_LOCALE_TEXT`
- `resolveLocaleText`
- `formatLocale`

### Theme overrides

```tsx
<DataGrid<User>
  mode="client"
  rows={rows}
  columns={columns}
  theme={{
    headerBackground: '#E0F2FE',
    toolbarBackground: '#F0F9FF',
    footerBackground: '#F0F9FF',
    selectionBackground: '#DBEAFE',
    rowAltBackground: '#F8FAFC',
    borderRadius: 16,
  }}
/>
```

### Row actions

`rowActions` opens a native-feeling action menu, by default on long press.

```tsx
import { MaterialIcons } from '@expo/vector-icons';

const rowActions = [
  {
    key: 'edit',
    label: 'Edit',
    icon: ({ color, size }: { color: string; size: number }) => (
      <MaterialIcons name="edit" color={color} size={size} />
    ),
    onPress: ({ rowId }: { rowId: string }) => {
      console.log('edit', rowId);
    },
  },
];

<DataGrid<User>
  mode="client"
  rows={rows}
  columns={columns}
  rowActions={rowActions}
/>;
```

### Actions column

You can also add a dedicated column with `type: 'actions'` and provide per-row actions.

```tsx
import { MaterialIcons } from '@expo/vector-icons';

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  {
    field: 'actions',
    headerName: 'Actions',
    type: 'actions',
    width: 132,
    actions: ({ rowId }) => [
      {
        key: `edit-${rowId}`,
        label: 'Edit',
        icon: ({ color, size }) => (
          <MaterialIcons name="edit" color={color} size={size} />
        ),
        onPress: () => {
          console.log(rowId);
        },
      },
    ],
    actionTrigger: {
      display: 'both',
      label: 'Actions',
      icon: ({ color, size }) => (
        <MaterialIcons name="more-horiz" color={color} size={size} />
      ),
    },
  },
];
```

## Column Definition

`ColumnDef<TRow>` supports:

- `field`, `headerName`
- `width`, `minWidth`, `flex`
- `type`: `'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'actions' | 'custom'`
- `sortable`, `filterable`, `hideable`, `searchable`
- `filterSelectOptions`, `filterSelectMultiple`
- `filterForceOperator`, `filterHideOperator`
- `valueGetter`, `valueFormatter`
- `renderCell`, `renderHeader`
- `sortComparator`, `filterOperators`
- `align`, `headerAlign`
- `actions`, `actionTrigger`

### Search Behavior

Global search now checks every non-actions column by default. Set `searchable: false` on a column when you want to opt it out.

Search matches:

- raw cell values
- `valueFormatter` output
- `filterSelectOptions` labels and values
- in `mode="server"` with `serverSearchMode="localRows"`, the search icon matches only the current `rows`

```tsx
const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'internalCode', headerName: 'Internal Code', searchable: false },
  {
    field: 'status',
    headerName: 'Status',
    filterSelectOptions: [
      { value: 'CODE-01', label: 'Disponivel' },
      { value: 'CODE-02', label: 'Em andamento' },
      { value: 'CODE-03', label: 'Finalizado' },
    ],
  },
];
```

### Advanced Filters

The built-in filter panel now adapts to the column:

- `number` columns show comparison operators such as equals, greater than, and less than
- `date` and `datetime` columns show date-aware operators such as is, before, after, is empty, and is not empty
- operators like `isEmpty` and `isNotEmpty` hide the value input because no value is needed
- select-based columns can render a built-in single or multi-select value picker

```tsx
const columns: ColumnDef<User>[] = [
  {
    field: 'status',
    headerName: 'Status',
    filterSelectOptions: [
      { value: 'CODE-01', label: 'Disponivel' },
      { value: 'CODE-02', label: 'Em andamento' },
      { value: 'CODE-03', label: 'Finalizado' },
    ],
    filterForceOperator: 'isAnyOf',
    filterHideOperator: true,
    filterSelectMultiple: true,
  },
  {
    field: 'finishedAt',
    headerName: 'Finished At',
    type: 'date',
    filterable: true,
    valueFormatter: (value) => formatDate(value),
  },
  {
    field: 'version',
    headerName: 'Version',
    type: 'number',
    filterable: true,
  },
];
```

Date filters accept ISO strings such as `2024-01-31`, and also localized inputs such as `31/01/2024`. For `date` columns the comparison is made by day, while `datetime` keeps the time component.

#### `filterForceOperator`

`filterForceOperator` must use the operator `value`, not the translated label. Accepted values depend on the column type:

- `string`, `custom`, `actions`: `contains`, `doesNotContain`, `equals`, `doesNotEqual`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`, `isAnyOf`
- columns with `filterSelectOptions`: `equals`, `doesNotEqual`, `isAnyOf`, `isEmpty`, `isNotEmpty`
- `number`: `equals`, `doesNotEqual`, `>`, `>=`, `<`, `<=`, `isEmpty`, `isNotEmpty`
- `date`, `datetime`: `is`, `not`, `before`, `onOrBefore`, `after`, `onOrAfter`, `isEmpty`, `isNotEmpty`
- `boolean`: `is`, `isEmpty`

The engine also accepts a few aliases for compatibility, but `filterForceOperator` should prefer the canonical values above.

### Toolbar Clear Filters

When search text, column filters, or hidden columns are active, the toolbar shows a `Clear filters` action before the buttons. It resets:

- `searchText`
- `serverLocalSearchText`
- `filterModel`
- `columnVisibilityModel`

## API Overview

Main `DataGrid` prop groups:

- Data: `rows`, `columns`, `getRowId`
- State: `state`, `initialState`, `onStateChange`, `onQueryChange`
- Sorting: `sortModel`, `onSortModelChange`, `enableMultiSort`
- Filtering: `filterModel`, `onFilterModelChange`, `maxFilters`
- Search: `searchText`, `onSearchTextChange`, `searchDebounceMs`, `serverSearchMode`, `serverLocalSearchText`, `onServerLocalSearchTextChange`
- Visibility: `columnVisibilityModel`, `onColumnVisibilityModelChange`
- Pagination: `paginationModel`, `onPaginationModelChange`, `pageSizeOptions`, `rowCount`
- Loading: `loading`, `refreshing`, `onRefresh`, `infinite`, `onEndReached`
- Selection: `selectionModel`, `onSelectionModelChange`, `checkboxSelection`
- Actions: `rowActions`, `rowActionMenuTrigger`
- Events: `onRowPress`, `onRowLongPress`, `onCellPress`, `onCellLongPress`
- UI: `theme`, `locale`, `localeText`, `emptyLabel`, `emptyState`, `loadingOverlay`

Useful rendering props:

- `rowHeight`
- `estimatedItemSize`
- `listMode`
- `getRowStyle`
- `zebraRows`
- `compact`
- `toolbarTitle`

## Exported Utilities

The package also exports pure utilities that can be reused in adapters, tests, or custom hooks:

- `applySorting`
- `applyFilter`
- `getFilterOperatorsForColumn`
- `getDefaultFilterOperatorsByType`
- `applySearch`
- `paginateRows`
- `getPaginationRange`
- `applyClientPipeline`

## Example App

The repository includes an Expo example in `example/` with:

- 10k client rows
- simulated server mode
- server mode with optional local toolbar search on returned rows
- infinite loading
- filters for multiple column types
- row actions and actions columns
- locale switching
- theme overrides

Run it with:

```sh
cd example
npx expo start
```

## License

MIT
