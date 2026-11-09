import { Text } from 'react-native';
import type { ColumnDef } from 'expo-flash-datagrid';

type Invoice = {
  id: string;
  amount: number;
  paid: boolean;
};

export const columns: ColumnDef<Invoice>[] = [
  {
    field: 'amount',
    headerName: 'Amount',
    type: 'number',
    valueFormatter: (value, row) =>
      `${row.paid ? 'Paid' : 'Due'}: $${value}`,
  },
  {
    field: 'paid',
    headerName: 'Status',
    type: 'boolean',
    renderCell: ({ row, isSelected }) => (
      <Text
        style={{ fontWeight: isSelected ? '700' : '400' }}
      >
        {row.paid ? 'Settled' : 'Open'}
      </Text>
    ),
  },
];
