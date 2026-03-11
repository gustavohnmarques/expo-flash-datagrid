# @gustavohnmarques/react-native-flash-datagrid

Mobile-first data grid for React Native with virtualization, sorting, filtering, search, pagination, row selection, row actions, and localization.

The component is designed for apps that need a more capable table than `FlatList`, while still keeping React Native ergonomics and strong TypeScript support.

## Highlights

- FlashList-powered rendering for large datasets
- Client and server data modes
- Sorting, filtering, global search, pagination, and infinite loading
- Column visibility management
- Selection model with mobile-oriented long-press behavior
- Row action menus and actions columns
- Theme overrides and locale overrides
- Built-in English and Portuguese locale bundles
- Exported pure utilities for sorting, filtering, search, and pagination

## Installation

This package currently expects an Expo-compatible setup because it uses `@expo/vector-icons` internally and safe-area aware modal surfaces.

If you already have an Expo app, `react`, `react-native`, `expo`, and `expo-font` are usually already present.

### npm

```sh
npm install @gustavohnmarques/react-native-flash-datagrid @shopify/flash-list react-native-safe-area-context @expo/vector-icons expo expo-font
```

### yarn

```sh
yarn add @gustavohnmarques/react-native-flash-datagrid @shopify/flash-list react-native-safe-area-context @expo/vector-icons expo expo-font
```

Required peers in the host app:

- `react`
- `react-native`
- `expo`
- `expo-font`
- `@expo/vector-icons`
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
import {
  DataGrid,
  type ColumnDef,
  type QueryState,
} from '@gustavohnmarques/react-native-flash-datagrid';

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
  { field: 'name', headerName: 'Name', flex: 1, searchable: true },
  { field: 'email', headerName: 'Email', flex: 1.2, searchable: true },
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
import {
  DataGrid,
  type QueryState,
} from '@gustavohnmarques/react-native-flash-datagrid';

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
    rowsPerPage: 'Itens por pagina',
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
/>
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
- `valueGetter`, `valueFormatter`
- `renderCell`, `renderHeader`
- `sortComparator`, `filterOperators`
- `align`, `headerAlign`
- `actions`, `actionTrigger`

## API Overview

Main `DataGrid` prop groups:

- Data: `rows`, `columns`, `getRowId`
- State: `state`, `initialState`, `onStateChange`, `onQueryChange`
- Sorting: `sortModel`, `onSortModelChange`, `enableMultiSort`
- Filtering: `filterModel`, `onFilterModelChange`, `maxFilters`
- Search: `searchText`, `onSearchTextChange`, `searchDebounceMs`
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
- `getDefaultFilterOperatorsByType`
- `applySearch`
- `paginateRows`
- `getPaginationRange`
- `applyClientPipeline`

## Example App

The repository includes an Expo example in `example/` with:

- 10k client rows
- simulated server mode
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

## Local Development

For local package rebuilds, tarball testing, and installing the package into another app, see:

- [docs/BUILD_AND_USE_LOCALLY.md](./docs/BUILD_AND_USE_LOCALLY.md)

## License

MIT
