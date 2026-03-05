import * as XLSX from 'xlsx';
import { Transaction, ServiceType, PaymentMethod, SERVICE_LABELS } from '@/types/transaction';
import { generateId } from '@/services/transactionService';

const SERVICE_LABEL_TO_KEY: Record<string, ServiceType> = {};
Object.entries(SERVICE_LABELS).forEach(([key, label]) => {
  SERVICE_LABEL_TO_KEY[label.toLowerCase()] = key as ServiceType;
  SERVICE_LABEL_TO_KEY[key.toLowerCase()] = key as ServiceType;
});

function parseServiceType(val: string): ServiceType {
  const lower = val.trim().toLowerCase();
  return SERVICE_LABEL_TO_KEY[lower] || 'other';
}

function parsePaymentMethod(val: string): PaymentMethod {
  const lower = val.trim().toLowerCase();
  if (lower.includes('mpesa') || lower.includes('m-pesa')) return 'mpesa';
  return 'cash';
}

function parseDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel serial date
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

export function parseImportFile(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          reject(new Error('No data found in file'));
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const transactions: Transaction[] = rows.map(row => {
          const date = parseDate(row['Date'] || row['date'] || '');
          return {
            id: generateId() + '-' + Math.random().toString(36).substr(2, 3),
            customerName: String(row['Customer'] || row['customer'] || row['Customer Name'] || row['Name'] || row['name'] || 'Unknown').trim().slice(0, 100),
            phoneNumber: String(row['Phone'] || row['phone'] || row['Phone Number'] || '').trim().slice(0, 15),
            serviceType: parseServiceType(String(row['Service'] || row['service'] || row['Service Type'] || 'other')),
            paymentMethod: parsePaymentMethod(String(row['Payment'] || row['payment'] || row['Payment Method'] || 'cash')),
            amount: Math.max(0, parseFloat(String(row['Amount'] || row['amount'] || row['Amount (KES)'] || '0')) || 0),
            date: date > today ? today : date,
            time: String(row['Time'] || row['time'] || '12:00').trim().slice(0, 5),
            notes: String(row['Notes'] || row['notes'] || '').trim().slice(0, 200),
          };
        }).filter(t => t.amount > 0 && t.customerName);

        resolve(transactions);
      } catch (err) {
        reject(new Error('Failed to parse file. Ensure it is a valid Excel or CSV file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
