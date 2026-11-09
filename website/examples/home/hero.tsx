import { DataGrid, type ColumnDef } from 'expo-flash-datagrid';

type Order = { id: string; customer: string; total: number; placedAt: string };

const columns: ColumnDef<Order>[] = [
  { field: 'customer', headerName: 'Customer', flex: 1 },
  { field: 'total', headerName: 'Total', type: 'number', width: 110 },
  { field: 'placedAt', headerName: 'Placed', type: 'date', width: 130 },
];

export function OrdersScreen({ orders }: { orders: Order[] }) {
  return (
    <DataGrid<Order>
      mode="client"
      rows={orders}
      columns={columns}
      enableMultiSort
      checkboxSelection
      style={{ flex: 1 }}
    />
  );
}
