import * as XLSX from 'xlsx';
import { Transaction, SERVICE_LABELS } from '@/types/transaction';

export function exportToExcel(transactions: Transaction[], filename: string) {
  const data = transactions.map(t => ({
    'Date': t.date,
    'Time': t.time,
    'Customer': t.customerName,
    'Phone': t.phoneNumber,
    'Service': SERVICE_LABELS[t.serviceType],
    'Payment': t.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash',
    'Amount (KES)': t.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCsv(transactions: Transaction[], filename: string) {
  const data = transactions.map(t => ({
    'Date': t.date,
    'Time': t.time,
    'Customer': t.customerName,
    'Phone': t.phoneNumber,
    'Service': SERVICE_LABELS[t.serviceType],
    'Payment': t.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash',
    'Amount (KES)': t.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
