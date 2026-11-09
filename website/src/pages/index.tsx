import { useState, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import clsx from 'clsx';

import heroSource from '!!raw-loader!@site/examples/home/hero.tsx';
import clientSource from '!!raw-loader!@site/examples/home/mode-client.tsx';
import serverSource from '!!raw-loader!@site/examples/home/mode-server.tsx';
import hybridSource from '!!raw-loader!@site/examples/home/mode-hybrid.tsx';
import typedSource from '!!raw-loader!@site/examples/home/typed.tsx';
import headlessSource from '!!raw-loader!@site/examples/home/headless.tsx';

import styles from './index.module.css';

const INSTALL_PACKAGES =
  'expo-flash-datagrid @shopify/flash-list react-native-safe-area-context @expo/vector-icons @react-native-community/datetimepicker expo expo-font';

/** Keeps only the JSX part of an example, so the imports it needs to compile stay off the page. */
function gridOnly(source: string): string {
  const start = source.indexOf('<DataGrid');
  const end = source.indexOf('/>', source.lastIndexOf('columns={columns}'));
  const body = source.slice(start, end + 2);
  return body.replace(/^ {2}/gm, '');
}

type Worker = 'grid' | 'api';

interface ModeOption {
  id: string;
  label: string;
  summary: string;
  source: string;
  steps: Record<'Filter' | 'Search' | 'Sort' | 'Paginate', { worker: Worker; note?: string }>;
}

const MODES: ModeOption[] = [
  {
    id: 'client',
    label: 'client',
    summary: 'All rows are on the device. The grid does the rest.',
    source: clientSource,
    steps: {
      Filter: { worker: 'grid' },
      Search: { worker: 'grid' },
      Sort: { worker: 'grid' },
      Paginate: { worker: 'grid' },
    },
  },
  {
    id: 'server',
    label: 'server',
    summary: 'The grid reports what the user wants. Your API returns that page.',
    source: serverSource,
    steps: {
      Filter: { worker: 'api' },
      Search: { worker: 'api' },
      Sort: { worker: 'api' },
      Paginate: { worker: 'api' },
    },
  },
  {
    id: 'hybrid',
    label: 'server + localRows',
    summary: 'Filters and sorting stay on the API. Search narrows the rows you already have.',
    source: hybridSource,
    steps: {
      Filter: { worker: 'api' },
      Search: { worker: 'grid', note: 'current rows' },
      Sort: { worker: 'api' },
      Paginate: { worker: 'api' },
    },
  },
];

const STEP_NAMES = ['Filter', 'Search', 'Sort', 'Paginate'] as const;

function ModeTable() {
  const [activeId, setActiveId] = useState('client');
  const active = MODES.find((mode) => mode.id === activeId) ?? MODES[0]!;

  return (
    <div className={styles.modeLayout}>
      <div>
        <div className={styles.modeSwitch} role="group" aria-label="Data mode">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              aria-pressed={mode.id === activeId}
              className={clsx(styles.modeButton, mode.id === activeId && styles.modeButtonActive)}
              onClick={() => setActiveId(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className={styles.modeSummary} aria-live="polite">
          {active.summary}
        </p>
        <table className={styles.ledger}>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Done by</th>
            </tr>
          </thead>
          <tbody>
            {STEP_NAMES.map((step) => {
              const { worker, note } = active.steps[step];
              return (
                <tr key={step}>
                  <th scope="row">{step}</th>
                  <td>
                    <span className={clsx(styles.worker, worker === 'grid' ? styles.workerGrid : styles.workerApi)}>
                      {worker === 'grid' ? 'Grid' : 'Your API'}
                    </span>
                    {note ? <span className={styles.workerNote}>{note}</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CodeBlock language="tsx" className={styles.modeCode}>
        {gridOnly(active.source)}
      </CodeBlock>
    </div>
  );
}

interface Capability {
  name: string;
  to: string;
  detail: string;
  props: string;
}

const CAPABILITIES: Capability[] = [
  { name: 'Sorting', to: '/docs/guides/sorting', detail: 'Single or multi-column, with custom comparators', props: 'sortModel, enableMultiSort' },
  { name: 'Filtering', to: '/docs/guides/filtering', detail: 'Operators and inputs matched to each column type', props: 'filterModel, maxFilters' },
  { name: 'Search', to: '/docs/guides/search', detail: 'Debounced across every searchable column', props: 'searchText, searchDebounceMs' },
  { name: 'Pagination', to: '/docs/guides/pagination', detail: 'Footer controls with page sizes', props: 'paginationModel, rowCount' },
  { name: 'Infinite scroll', to: '/docs/guides/infinite-scroll', detail: 'Load more as people reach the end', props: 'infinite, onEndReached' },
  { name: 'Selection', to: '/docs/guides/selection', detail: 'Checkboxes or long press, tracked by row ID', props: 'selectionModel, checkboxSelection' },
  { name: 'Row actions', to: '/docs/guides/row-actions', detail: 'Long-press menus and actions columns', props: 'rowActions, rowActionMenuTrigger' },
  { name: 'Column visibility', to: '/docs/guides/column-visibility', detail: 'A built-in menu to show and hide columns', props: 'columnVisibilityModel' },
  { name: 'Theming', to: '/docs/guides/theming', detail: 'Override colors, sizes, and row styles', props: 'theme, getRowStyle, zebraRows' },
  { name: 'Localization', to: '/docs/guides/localization', detail: 'English and Portuguese, with overrides', props: 'locale, localeText' },
];

function Section({ id, title, children, intro }: { id?: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {intro ? <p className={styles.sectionIntro}>{intro}</p> : null}
      {children}
    </section>
  );
}

export default function Home() {
  useBrokenLinks().collectAnchor('install');

  return (
    <Layout
      title="A real data table for Expo apps"
      description="Sorting, filters, search, pagination, and selection in one typed React Native component, rendered with FlashList."
    >
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>A real data table for Expo apps.</h1>
            <p className={styles.heroLead}>
              Sorting, filters, search, pagination, and selection in one typed component. Stop rebuilding a table on top
              of a list.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} to="/docs/quick-start">
                Get started
              </Link>
              <Link className={styles.secondaryAction} href="#install">
                Install
              </Link>
            </div>
          </div>
          <dl className={styles.spec}>
            <div>
              <dt>Platforms</dt>
              <dd>iOS, Android</dd>
            </div>
            <div>
              <dt>Expo SDK</dt>
              <dd>55 – 57</dd>
            </div>
            <div>
              <dt>Lists</dt>
              <dd>FlashList 2</dd>
            </div>
            <div>
              <dt>License</dt>
              <dd>MIT</dd>
            </div>
          </dl>
        </header>

        <div className={styles.heroCode}>
          <CodeBlock language="tsx" title="OrdersScreen.tsx">
            {heroSource}
          </CodeBlock>
        </div>

        <Section
          title="One prop decides who does the work."
          intro="Keep the full dataset on the device, send every query to your API, or mix the two."
        >
          <ModeTable />
        </Section>

        <Section title="What you stop building">
          <table className={styles.capabilities}>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">What the grid handles</th>
                <th scope="col" className={styles.propsColumn}>
                  Main props
                </th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((capability) => (
                <tr key={capability.name}>
                  <th scope="row">
                    <Link to={capability.to}>{capability.name}</Link>
                  </th>
                  <td>{capability.detail}</td>
                  <td className={styles.propsColumn}>
                    <code>{capability.props}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <section className={clsx(styles.section, styles.split)}>
          <div>
            <h2 className={styles.sectionTitle}>Typed from row to callback.</h2>
            <p className={styles.sectionIntro}>
              <code>ColumnDef&lt;TRow&gt;</code> carries your row type into formatters, cell renderers, comparators, and
              row actions.
            </p>
            <Link className={styles.textLink} to="/docs/api/column-def">
              ColumnDef reference
            </Link>
          </div>
          <CodeBlock language="tsx">{typedSource}</CodeBlock>
        </section>

        <section className={clsx(styles.section, styles.engine)}>
          <h2 className={styles.sectionTitle}>Rendered with FlashList.</h2>
          <p className={styles.sectionIntro}>
            On iOS, rows render through FlashList by default. On Android the default is FlatList, and one prop switches
            it.
          </p>
          <table className={styles.ledger}>
            <thead>
              <tr>
                <th scope="col">
                  <code>listMode</code>
                </th>
                <th scope="col">iOS</th>
                <th scope="col">Android</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <code>auto</code>
                </th>
                <td>FlashList</td>
                <td>FlatList</td>
              </tr>
              <tr>
                <th scope="row">
                  <code>flash-list</code>
                </th>
                <td>FlashList</td>
                <td>FlashList</td>
              </tr>
              <tr>
                <th scope="row">
                  <code>flat-list</code>
                </th>
                <td>FlatList</td>
                <td>FlatList</td>
              </tr>
            </tbody>
          </table>
          <Link className={styles.textLink} to="/docs/concepts/list-engine">
            Choosing a list engine
          </Link>
        </section>

        <section className={clsx(styles.section, styles.split, styles.splitReverse)}>
          <CodeBlock language="tsx">{headlessSource}</CodeBlock>
          <div>
            <h2 className={styles.sectionTitle}>Keep the logic, skip the component.</h2>
            <p className={styles.sectionIntro}>
              The sort, filter, search, and pagination steps are exported as pure functions. Use them in adapters, tests,
              or a mock API.
            </p>
            <Link className={styles.textLink} to="/docs/api/utilities">
              Utilities reference
            </Link>
          </div>
        </section>

        <section id="install" className={styles.install}>
          <h2 className={styles.installTitle}>Install it.</h2>
          <Tabs groupId="package-manager">
            <TabItem value="npm" label="npm">
              <CodeBlock language="sh">{`npm install ${INSTALL_PACKAGES}`}</CodeBlock>
            </TabItem>
            <TabItem value="yarn" label="yarn">
              <CodeBlock language="sh">{`yarn add ${INSTALL_PACKAGES}`}</CodeBlock>
            </TabItem>
          </Tabs>
          <p className={styles.installNote}>
            Wrap your app in <code>SafeAreaProvider</code>, then build your first grid.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} to="/docs/quick-start">
              Read the quick start
            </Link>
            <Link className={styles.secondaryAction} to="/docs/api/data-grid-props">
              Browse the API
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
