import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';

import { codeTheme } from './src/codeTheme';

const repoUrl = 'https://github.com/gustavohnmarques/expo-flash-datagrid';

const config: Config = {
  title: 'expo-flash-datagrid',
  tagline: 'A real data table for Expo and React Native apps.',
  favicon: 'img/favicon.svg',

  url: 'https://gustavohnmarques.github.io',
  baseUrl: '/expo-flash-datagrid/',
  trailingSlash: false,
  organizationName: 'gustavohnmarques',
  projectName: 'expo-flash-datagrid',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${repoUrl}/edit/main/website/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'expo-flash-datagrid',
      logo: {
        alt: '',
        src: 'img/logo.svg',
        width: 24,
        height: 24,
      },
      items: [
        { to: '/docs', label: 'Docs', position: 'left', activeBaseRegex: '/docs(/(?!api|examples).*)?$' },
        { to: '/docs/examples/client-mode', label: 'Examples', position: 'left', activeBasePath: '/docs/examples' },
        { to: '/docs/api/data-grid-props', label: 'API', position: 'left', activeBasePath: '/docs/api' },
        { href: 'https://www.npmjs.com/package/expo-flash-datagrid', label: 'npm', position: 'right' },
        { href: repoUrl, label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Installation', to: '/docs/installation' },
            { label: 'Quick start', to: '/docs/quick-start' },
            { label: 'DataGrid props', to: '/docs/api/data-grid-props' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: repoUrl },
            { label: 'npm', href: 'https://www.npmjs.com/package/expo-flash-datagrid' },
            { label: 'Issues', href: `${repoUrl}/issues` },
          ],
        },
      ],
      copyright: `MIT License. Built on <a href="https://shopify.github.io/flash-list/">FlashList</a> by Shopify.`,
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    prism: {
      theme: codeTheme,
      darkTheme: codeTheme,
      additionalLanguages: ['bash', 'diff', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
