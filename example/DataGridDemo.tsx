import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DataGrid,
  applyFilter,
  applySearch,
  applySorting,
  type ColumnDef,
  type DataGridLocale,
  type QueryState,
  type RowActionMenuIconProps,
} from 'expo-flash-datagrid';

type DemoStatus = 'new' | 'active' | 'paused';

interface DemoRow {
  id: string;
  name: string;
  city: string;
  age: number;
  salary: number;
  registeredAt: string;
  active: boolean;
  status: DemoStatus;
}

const NAMES = [
  'Alice',
  'Bruno',
  'Camila',
  'Daniel',
  'Eduarda',
  'Felipe',
  'Gabriela',
  'Helena',
  'Igor',
  'Julia',
  'Kaio',
  'Larissa',
  'Marcos',
  'Natasha',
  'Otavio',
  'Paula',
];

const CITIES = [
  'Sao Paulo',
  'Rio',
  'Belo Horizonte',
  'Porto Alegre',
  'Curitiba',
  'Florianopolis',
  'Brasilia',
];

function createMockRows(count: number): DemoRow[] {
  return Array.from({ length: count }, (_, index) => {
    const month = (index % 12) + 1;
    const day = (index % 28) + 1;
    const city = CITIES[index % CITIES.length] ?? 'Unknown';
    const statusIndex = index % 3;
    const status: DemoStatus =
      statusIndex === 0 ? 'new' : statusIndex === 1 ? 'active' : 'paused';

    return {
      id: `row-${index + 1}`,
      name: `${NAMES[index % NAMES.length]} ${index + 1}`,
      city,
      age: 18 + (index % 52),
      salary: 3200 + ((index * 57) % 9800),
      registeredAt: `2024-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`,
      active: index % 2 === 0,
      status,
    };
  });
}

const ALL_ROWS = createMockRows(10_000);

const DEFAULT_STATE: QueryState = {
  paginationModel: { page: 0, pageSize: 25 },
  sortModel: [],
  filterModel: { items: [], logicOperator: 'and' },
  searchText: '',
  columnVisibilityModel: {},
  selectionModel: [],
};

function getStatusColor(status: DemoStatus): string {
  if (status === 'active') {
    return '#16A34A';
  }
  if (status === 'paused') {
    return '#D97706';
  }
  return '#2563EB';
}

interface DemoEvent {
  id: number;
  message: string;
}

function CheckoutActionIcon({ color, size }: RowActionMenuIconProps) {
  return <MaterialIcons color={color} name="shopping-cart" size={size} />;
}

function EmergencyActionIcon({ color, size }: RowActionMenuIconProps) {
  return <MaterialIcons color={color} name="medical-services" size={size} />;
}

function ActionsTriggerIcon({ color, size }: RowActionMenuIconProps) {
  return <MaterialIcons color={color} name="more-horiz" size={size} />;
}

export function DataGridDemo() {
  const { width, height } = useWindowDimensions();
  const isTabletLandscape = width >= 1024 && width > height;
  const [mode, setMode] = useState<'client' | 'server'>('client');
  const [locale, setLocale] = useState<DataGridLocale>('pt');
  const [serverInfinite, setServerInfinite] = useState(false);

  const [clientState, setClientState] = useState<QueryState>(DEFAULT_STATE);

  const [serverState, setServerState] = useState<QueryState>(DEFAULT_STATE);
  const [serverRows, setServerRows] = useState<DemoRow[]>([]);
  const [serverRowCount, setServerRowCount] = useState(0);
  const [serverLoading, setServerLoading] = useState(false);
  const [clientRefreshing, setClientRefreshing] = useState(false);
  const [serverRefreshing, setServerRefreshing] = useState(false);
  const [serverCursor, setServerCursor] = useState(0);
  const requestIdRef = useRef(0);

  const eventSequenceRef = useRef(0);
  const [events, setEvents] = useState<DemoEvent[]>([]);

  const pushEvent = useCallback((message: string) => {
    const nextId = ++eventSequenceRef.current;
    setEvents((previous) => [{ id: nextId, message }, ...previous].slice(0, 4));
  }, []);

  const rowActions = useCallback(
    ({ row }: { row: DemoRow }) => [
      {
        key: `checkout-${row.id}`,
        label: 'Checkout',
        icon: CheckoutActionIcon,
        onPress: () => pushEvent(`Checkout: ${row.id}`),
      },
      {
        key: `er-${row.id}`,
        label: locale === 'pt' ? 'Realizar ER' : 'Run ER',
        icon: EmergencyActionIcon,
        onPress: () => pushEvent(`ER: ${row.id}`),
      },
    ],
    [locale, pushEvent]
  );

  const columns = useMemo<ColumnDef<DemoRow>[]>(() => {
    const statusFilterOptions = [
      {
        value: 'new',
        label: locale === 'pt' ? 'Novo' : 'New',
      },
      {
        value: 'active',
        label: locale === 'pt' ? 'Ativo' : 'Active',
      },
      {
        value: 'paused',
        label: locale === 'pt' ? 'Pausado' : 'Paused',
      },
    ];

    return [
      {
        field: 'name',
        headerName: 'Name',
        minWidth: 180,
        flex: 1.3,
        sortable: true,
        filterable: true,
        searchable: true,
      },
      {
        field: 'city',
        headerName: 'City',
        minWidth: 130,
        flex: 1,
        sortable: true,
        filterable: true,
        searchable: true,
      },
      {
        field: 'age',
        headerName: 'Age',
        type: 'number',
        width: 90,
        sortable: true,
        filterable: true,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        type: 'number',
        width: 120,
        sortable: true,
        filterable: true,
        valueFormatter: (value) => `$${Number(value ?? 0).toFixed(0)}`,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'registeredAt',
        headerName: 'Registered',
        type: 'date',
        width: 130,
        sortable: true,
        filterable: true,
      },
      {
        field: 'active',
        headerName: 'Active',
        type: 'boolean',
        width: 90,
        sortable: true,
        filterable: true,
        valueFormatter: (value) => (value ? 'Yes' : 'No'),
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'string',
        width: 120,
        sortable: true,
        filterable: true,
        filterSelectOptions: statusFilterOptions,
        filterForceOperator: 'isAnyOf',
        filterHideOperator: true,
        filterSelectMultiple: true,
        valueFormatter: (value) =>
          statusFilterOptions.find((option) => option.value === value)?.label ??
          String(value ?? ''),
        renderCell: ({ value }) => (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor((value as DemoStatus) ?? 'new'),
              },
            ]}
          >
            <Text style={styles.statusLabel}>
              {String(value ?? '').toUpperCase()}
            </Text>
          </View>
        ),
      },
      {
        field: 'actions',
        headerName: locale === 'pt' ? 'Ações' : 'Actions',
        width: 138,
        type: 'actions',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        searchable: false,
        actions: rowActions,
        actionTrigger: {
          display: 'both',
          icon: ActionsTriggerIcon,
          label: locale === 'pt' ? 'Ações' : 'Actions',
        },
      },
    ];
  }, [locale, rowActions]);

  const fetchServerRows = useCallback(
    (page: number, append: boolean, onComplete?: () => void) => {
      const requestId = ++requestIdRef.current;
      setServerLoading(true);
      const pageSize = serverState.paginationModel.pageSize;

      setTimeout(() => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const filtered = applyFilter(
          ALL_ROWS,
          columns,
          serverState.filterModel
        );
        const searched = applySearch(filtered, columns, serverState.searchText);
        const sorted = applySorting(searched, columns, serverState.sortModel);

        setServerRowCount(sorted.length);
        const from = page * pageSize;
        const to = from + pageSize;
        const nextPageRows = sorted.slice(from, to);

        setServerRows((previous) =>
          append ? [...previous, ...nextPageRows] : nextPageRows
        );
        setServerCursor(page);
        setServerLoading(false);
        onComplete?.();
      }, 450);
    },
    [
      columns,
      serverState.filterModel,
      serverState.paginationModel.pageSize,
      serverState.searchText,
      serverState.sortModel,
    ]
  );

  useEffect(() => {
    if (mode !== 'server') {
      return;
    }

    if (serverInfinite) {
      fetchServerRows(0, false);
      return;
    }

    fetchServerRows(serverState.paginationModel.page, false);
  }, [
    fetchServerRows,
    mode,
    serverInfinite,
    serverState.filterModel,
    serverState.paginationModel.page,
    serverState.paginationModel.pageSize,
    serverState.searchText,
    serverState.sortModel,
  ]);

  const handleServerEndReached = useCallback(() => {
    if (!serverInfinite || serverLoading) {
      return;
    }

    const nextPage = serverCursor + 1;
    const nextOffset = nextPage * serverState.paginationModel.pageSize;
    if (nextOffset >= serverRowCount) {
      return;
    }

    fetchServerRows(nextPage, true);
  }, [
    fetchServerRows,
    serverCursor,
    serverInfinite,
    serverLoading,
    serverRowCount,
    serverState.paginationModel.pageSize,
  ]);

  const rowStyle = useCallback((row: DemoRow) => {
    if (row.status === 'paused') {
      return { backgroundColor: '#FFF7ED' };
    }
    return undefined;
  }, []);

  const handleRefresh = useCallback(() => {
    if (mode === 'client') {
      if (clientRefreshing) {
        return;
      }

      setClientRefreshing(true);
      pushEvent(
        locale === 'pt'
          ? 'Atualização manual iniciada'
          : 'Manual refresh started'
      );
      setTimeout(() => {
        setClientRefreshing(false);
        pushEvent(
          locale === 'pt'
            ? 'Atualização manual concluída'
            : 'Manual refresh completed'
        );
      }, 700);
      return;
    }

    if (serverRefreshing) {
      return;
    }

    setServerRefreshing(true);
    pushEvent(
      locale === 'pt' ? 'Refresh server iniciado' : 'Server refresh started'
    );
    fetchServerRows(
      serverInfinite ? 0 : serverState.paginationModel.page,
      false,
      () => {
        setServerRefreshing(false);
        pushEvent(
          locale === 'pt'
            ? 'Refresh server concluído'
            : 'Server refresh completed'
        );
      }
    );
  }, [
    clientRefreshing,
    fetchServerRows,
    locale,
    mode,
    pushEvent,
    serverInfinite,
    serverRefreshing,
    serverState.paginationModel.page,
  ]);

  const handleStateChange = useCallback(
    (nextState: QueryState) => {
      if (mode === 'client') {
        setClientState(nextState);
        return;
      }

      setServerState((previous) => ({
        ...nextState,
        paginationModel: serverInfinite
          ? {
              ...nextState.paginationModel,
              page: previous.paginationModel.page,
            }
          : nextState.paginationModel,
      }));
    },
    [mode, serverInfinite]
  );

  const activeState = mode === 'client' ? clientState : serverState;
  const eventFallbackLabel =
    locale === 'pt'
      ? 'Toque nas linhas/células para registrar eventos.'
      : 'Tap rows/cells to log events.';
  const eventsTitle = locale === 'pt' ? 'Últimos eventos' : 'Latest events';
  const demoSummaryTitle =
    locale === 'pt' ? 'Modo tablet horizontal' : 'Landscape tablet mode';
  const demoSummaryText =
    locale === 'pt'
      ? 'O exemplo foi ajustado para usar mais largura em tablets, mantendo o grid como área principal.'
      : 'The example now uses extra tablet width and keeps the grid as the primary surface.';
  const datasetLabel =
    locale === 'pt'
      ? `Dataset: ${ALL_ROWS.length.toLocaleString('pt-BR')} linhas`
      : `Dataset: ${ALL_ROWS.length.toLocaleString('en-US')} rows`;
  const serverLabel =
    locale === 'pt'
      ? `Server mode: ${serverInfinite ? 'infinite ligado' : 'paginado'}`
      : `Server mode: ${serverInfinite ? 'infinite on' : 'paged'}`;
  const emptyGridLabel =
    locale === 'pt'
      ? 'Nenhum resultado para os filtros atuais'
      : 'No results for current filters';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.layout, isTabletLandscape && styles.layoutTablet]}>
        <View style={styles.mainColumn}>
          <View style={styles.header}>
            <Text style={styles.title}>Flash DataGrid Demo</Text>
            <Text style={styles.subtitle}>
              10k rows with client and server modes
            </Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.segment}>
              <Pressable
                style={[
                  styles.segmentButton,
                  mode === 'client' && styles.segmentButtonActive,
                ]}
                onPress={() => setMode('client')}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    mode === 'client' && styles.segmentLabelActive,
                  ]}
                >
                  Client mode
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.segmentButton,
                  mode === 'server' && styles.segmentButtonActive,
                ]}
                onPress={() => setMode('server')}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    mode === 'server' && styles.segmentLabelActive,
                  ]}
                >
                  Server mode
                </Text>
              </Pressable>
            </View>

            <View style={styles.segment}>
              <Pressable
                style={[
                  styles.segmentButton,
                  locale === 'pt' && styles.segmentButtonActive,
                ]}
                onPress={() => setLocale('pt')}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    locale === 'pt' && styles.segmentLabelActive,
                  ]}
                >
                  PT
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.segmentButton,
                  locale === 'en' && styles.segmentButtonActive,
                ]}
                onPress={() => setLocale('en')}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    locale === 'en' && styles.segmentLabelActive,
                  ]}
                >
                  EN
                </Text>
              </Pressable>
            </View>

            {mode === 'server' ? (
              <Pressable
                onPress={() => setServerInfinite((previous) => !previous)}
                style={styles.toggle}
              >
                <Text style={styles.toggleLabel}>
                  Infinite loading: {serverInfinite ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.gridContainer}>
            <DataGrid<DemoRow>
              columns={columns}
              rows={mode === 'client' ? ALL_ROWS : serverRows}
              mode={mode}
              state={activeState}
              onStateChange={handleStateChange}
              rowCount={mode === 'client' ? ALL_ROWS.length : serverRowCount}
              loading={mode === 'server' ? serverLoading : false}
              refreshing={
                mode === 'client' ? clientRefreshing : serverRefreshing
              }
              onRefresh={handleRefresh}
              infinite={mode === 'server' ? serverInfinite : false}
              onEndReached={
                mode === 'server' ? handleServerEndReached : undefined
              }
              getRowStyle={rowStyle}
              zebraRows
              enableMultiSort
              estimatedItemSize={44}
              checkboxSelection
              rowActions={rowActions}
              searchDebounceMs={280}
              pageSizeOptions={[10, 25, 50]}
              locale={locale}
              emptyLabel={emptyGridLabel}
              theme={{
                headerBackground: '#E0F2FE',
                toolbarBackground: '#F0F9FF',
                footerBackground: '#F0F9FF',
                selectionBackground: '#DBEAFE',
                rowAltBackground: '#F8FAFC',
              }}
              onRowPress={(row) => pushEvent(`Row press: ${row.id}`)}
              onRowLongPress={(row) => pushEvent(`Row long press: ${row.id}`)}
              onRowLongPressDetails={({ row, position }) =>
                pushEvent(
                  `Long press @ ${Math.round(position.pageX)},${Math.round(
                    position.pageY
                  )} -> ${row.id}`
                )
              }
              onCellPress={({ row, column }) =>
                pushEvent(`Cell press: ${column.field} -> ${row.id}`)
              }
              onCellLongPress={({ row, column }) =>
                pushEvent(`Cell long: ${column.field} -> ${row.id}`)
              }
              style={styles.grid}
            />
          </View>
        </View>

        <View
          style={[
            styles.sidePanel,
            isTabletLandscape
              ? styles.sidePanelTablet
              : styles.sidePanelStacked,
          ]}
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>{demoSummaryTitle}</Text>
            <Text style={styles.infoCardBody}>{demoSummaryText}</Text>
            <Text style={styles.infoCardMeta}>{datasetLabel}</Text>
            <Text style={styles.infoCardMeta}>{serverLabel}</Text>
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerTitle}>{eventsTitle}</Text>
            {events.length ? (
              events.map((eventItem) => (
                <Text key={eventItem.id} style={styles.footerLine}>
                  {eventItem.message}
                </Text>
              ))
            ) : (
              <Text style={styles.footerLine}>{eventFallbackLabel}</Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  layout: {
    flex: 1,
  },
  layoutTablet: {
    flexDirection: 'row',
  },
  mainColumn: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#334155',
    fontSize: 13,
    marginTop: 2,
  },
  controls: {
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#0EA5E9',
  },
  segmentLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
  },
  toggle: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  toggleLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  grid: {
    flex: 1,
    height: undefined,
    minHeight: 0,
  },
  sidePanel: {
    paddingBottom: 10,
    paddingTop: 10,
  },
  sidePanelTablet: {
    paddingLeft: 0,
    paddingRight: 10,
    width: 320,
  },
  sidePanelStacked: {
    paddingHorizontal: 10,
  },
  infoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoCardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  infoCardBody: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  infoCardMeta: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  footerInfo: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#CBD5E1',
    borderTopWidth: 1,
    borderRadius: 16,
    flex: 1,
    minHeight: 92,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  footerTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  footerLine: {
    color: '#334155',
    fontSize: 12,
    marginTop: 1,
  },
});
