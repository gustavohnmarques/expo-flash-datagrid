# Build And Use Locally

This guide explains how to rebuild `@gustavohnmarques/react-native-flash-datagrid` and use it in another local React Native / Expo project before publishing to npm.

## Prerequisites

- Node.js installed
- `corepack` enabled
- The library dependencies installed
- Your app already has compatible peers:
  - `react`
  - `react-native`
  - `@shopify/flash-list`

Current peer requirement from this library:

```json
{
  "@shopify/flash-list": "^2.3.0"
}
```

If your app uses an older `@shopify/flash-list`, `npm install` may fail with `ERESOLVE`.

## 1. Rebuild the library

From the library root:

```sh
cd F:\react-native-flash-datagrid
corepack yarn install
corepack yarn prepare
```

This runs `react-native-builder-bob` and regenerates:

- `lib/commonjs`
- `lib/module`
- `lib/typescript`

You should rebuild every time you change the library source and want to retest it in another project.

## 2. Validate before consuming

Recommended validation:

```sh
cd F:\react-native-flash-datagrid
corepack yarn typecheck
corepack yarn test --runInBand
corepack yarn workspace example tsc --noEmit
```

## 3. Generate a local package tarball

Still in the library root:

```sh
cd F:\react-native-flash-datagrid
npm pack
```

This creates a file similar to:

```txt
gustavohnmarques-react-native-flash-datagrid-0.1.0.tgz
```

This is the closest local test to a real npm publish.

## 4. Install the tarball in your app

Example for another local app:

```sh
cd F:\bizpoke\domo\domo-mobile
npm install F:\react-native-flash-datagrid\gustavohnmarques-react-native-flash-datagrid-0.1.0.tgz
```

After installing:

```sh
npx expo start -c
```

Use `-c` to clear the Metro cache when switching package builds.

## 5. Rebuild after library changes

When you change the library again:

```sh
cd F:\react-native-flash-datagrid
corepack yarn prepare
npm pack
```

Then reinstall the new tarball in your app:

```sh
cd F:\bizpoke\domo\domo-mobile
npm install F:\react-native-flash-datagrid\gustavohnmarques-react-native-flash-datagrid-0.1.0.tgz
npx expo start -c
```

If the version did not change, reinstalling the tarball is still valid as long as the file was regenerated.

## Alternative: install from local folder

You can also install directly from the library folder:

```json
{
  "dependencies": {
    "@gustavohnmarques/react-native-flash-datagrid": "file:../../../react-native-flash-datagrid"
  }
}
```

Then run:

```sh
cd F:\bizpoke\domo\domo-mobile
npm install
npx expo start -c
```

This is convenient during development, but the `.tgz` flow is more reliable because it tests the package as it will actually be published.

## Recommended workflow

For stability:

1. Update the library source.
2. Run `corepack yarn prepare`.
3. Run `npm pack`.
4. Install the generated `.tgz` in the app.
5. Run `npx expo start -c`.

## Troubleshooting

### `ERESOLVE unable to resolve dependency tree`

Most common cause: peer dependency mismatch, especially `@shopify/flash-list`.

Check your app:

```sh
npm ls @shopify/flash-list
```

Check the library peer requirement in `package.json`.

### Metro is still using the old package

Clear cache:

```sh
npx expo start -c
```

If needed, remove and reinstall:

```sh
rm -r node_modules
npm install
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Type changes are not reflected

Rebuild the library again:

```sh
cd F:\react-native-flash-datagrid
corepack yarn prepare
```

The generated typings come from:

- `lib/typescript/commonjs/src/index.d.ts`

## Package entry points

This library is configured to be consumed with:

```json
{
  "main": "./lib/commonjs/index.js",
  "module": "./lib/module/index.js",
  "types": "./lib/typescript/commonjs/src/index.d.ts",
  "react-native": "./src/index.ts",
  "source": "./src/index.ts"
}
```

That means:

- bundlers can use source for React Native
- TypeScript can resolve generated types
- CommonJS/ESM builds are available for packaging
