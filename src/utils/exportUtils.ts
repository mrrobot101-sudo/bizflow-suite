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
    'M-Pesa Code': t.mpesaCode || '',
    'Quantity': t.quantity ?? 1,
    'Amount (KES)': t.amount,
    'Notes': t.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  XLSX.utils.sheet_add_aoa(ws, [[], ['', '', '', '', '', '', '', 'TOTAL', total]], { origin: -1 });
  ws['!cols'] = [12, 8, 22, 14, 18, 10, 14, 9, 14, 24].map(w => ({ wch: w }));
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
    'M-Pesa Code': t.mpesaCode || '',
    'Quantity': t.quantity ?? 1,
    'Amount (KES)': t.amount,
    'Notes': t.notes || '',
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

export function downloadImportTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Customer', 'Phone', 'Service', 'Quantity', 'Amount', 'Payment', 'M-Pesa Code', 'Date', 'Time', 'Notes'],
    ['John Kamau', '0712345678', 'Printing', 10, 100, 'M-Pesa', 'SBK1A2B3C4', '2026-09-15', '10:30', 'B/W A4'],
    ['Walk-in', '', 'Photocopying', 5, 25, 'Cash', '', '2026-09-15', '11:00', ''],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'CyberMIS_Import_Template.xlsx');
}
