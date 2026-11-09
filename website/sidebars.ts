import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Getting started',
      collapsed: false,
      items: ['introduction', 'installation', 'quick-start', 'compatibility'],
    },
    {
      type: 'category',
      label: 'Concepts',
      collapsed: false,
      items: ['concepts/client-vs-server', 'concepts/state-management', 'concepts/list-engine'],
    },
    {
      type: 'category',
      label: 'Feature guides',
      collapsed: false,
      items: [
        'guides/columns',
        'guides/custom-cells',
        'guides/sorting',
        'guides/filtering',
        'guides/custom-filter-operators',
        'guides/search',
        'guides/pagination',
        'guides/infinite-scroll',
        'guides/refresh-and-loading',
        'guides/selection',
        'guides/row-actions',
        'guides/actions-column',
        'guides/column-visibility',
        'guides/events',
        'guides/theming',
        'guides/localization',
        'guides/empty-state',
      ],
    },
    {
      type: 'category',
      label: 'More',
      collapsed: true,
      items: ['changelog', 'migration-0-3', 'faq'],
    },
  ],
  examples: [
    {
      type: 'category',
      label: 'Data',
      collapsed: false,
      items: [
        'examples/client-mode',
        'examples/server-pagination',
        'examples/server-infinite',
        'examples/server-local-search',
        'examples/controlled-state',
      ],
    },
    {
      type: 'category',
      label: 'Cells and filters',
      collapsed: false,
      items: [
        'examples/custom-cells',
        'examples/date-and-boolean-filters',
        'examples/select-filters',
        'examples/custom-operator',
      ],
    },
    {
      type: 'category',
      label: 'Actions',
      collapsed: false,
      items: ['examples/selection-bulk-actions', 'examples/row-actions', 'examples/actions-column'],
    },
    {
      type: 'category',
      label: 'Appearance and logic',
      collapsed: false,
      items: ['examples/theme-dark', 'examples/localization', 'examples/headless-utils'],
    },
  ],
  api: [
    'api/data-grid-props',
    'api/column-def',
    'api/types',
    'api/hooks',
    'api/utilities',
    'api/locale-keys',
  ],
};

export default sidebars;
