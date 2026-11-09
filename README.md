# expo-flash-datagrid

React Native data grid and Expo data table built on top of FlashList, with virtualization, sorting, filtering, global search, pagination, row selection, row actions, and localization.

**[Read the documentation](https://gustavohnmarques.github.io/expo-flash-datagrid/)**

## Features

- FlashList-powered rendering for large datasets
- Client and server data modes
- Sorting, filtering, global search, pagination, and infinite loading
- Column visibility management
- Selection model with mobile-oriented long-press behavior
- Row action menus and actions columns
- Theme overrides and built-in English and Portuguese text
- Exported pure utilities for sorting, filtering, search, and pagination

## Compatibility

Expo-only for now: the package depends on `@expo/vector-icons`, `expo-font`, and `@react-native-community/datetimepicker`.

| expo-flash-datagrid | Expo SDK | React Native | FlashList |
| --- | --- | --- | --- |
| 0.3.x | 55 – 57 (developed and tested on 57) | 0.83 – 0.86 | 2.x (2.3.3+ recommended) |
| 0.2.x | 55 | 0.83 | 2.x |

## Installation

### npm

```sh
npm install expo-flash-datagrid @shopify/flash-list react-native-safe-area-context @expo/vector-icons @react-native-community/datetimepicker expo expo-font
```

### yarn

```sh
yarn add expo-flash-datagrid @shopify/flash-list react-native-safe-area-context @expo/vector-icons @react-native-community/datetimepicker expo expo-font
```

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

## Quick start

```tsx
import { View } from 'react-native';
import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

type User = {
  id: string;
  name: string;
  email: string;
  age: number;
};

const rows: User[] = [
  { id: '1', name: 'Alice', email: 'alice@company.com', age: 29 },
  { id: '2', name: 'Bruno', email: 'bruno@company.com', age: 34 },
];

const columns: ColumnDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'email', headerName: 'Email', flex: 1.2 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
];

export function UsersScreen() {
  return (
    <View style={{ flex: 1 }}>
      <DataGrid<User> mode="client" rows={rows} columns={columns} style={{ flex: 1 }} />
    </View>
  );
}
```

Guides, examples, and the full API are on the [documentation site](https://gustavohnmarques.github.io/expo-flash-datagrid/).

## Example app

```sh
cd example
npx expo start
```

## License

MIT
