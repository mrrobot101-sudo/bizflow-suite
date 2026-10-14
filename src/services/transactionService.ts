import { supabase } from '@/integrations/supabase/client';
import { Transaction, ServiceType, PaymentMethod } from '@/types/transaction';

const LEGACY_STORAGE_KEY = 'cyber-mis-transactions';

type Row = {
  id: string;
  customer_name: string;
  phone_number: string;
  service_type: string;
  payment_method: string;
  quantity: number;
  amount: number | string;
  mpesa_code: string;
  date: string;
  time: string;
  notes: string;
  created_by: string;
};

const fromRow = (r: Row): Transaction => ({
  id: r.id,
  customerName: r.customer_name,
  phoneNumber: r.phone_number,
  serviceType: r.service_type as ServiceType,
  paymentMethod: r.payment_method as PaymentMethod,
  quantity: r.quantity,
  amount: Number(r.amount),
  mpesaCode: r.mpesa_code,
  date: r.date,
  time: r.time,
  notes: r.notes,
  createdBy: r.created_by,
});

const toRow = (t: Transaction) => ({
  customer_name: t.customerName,
  phone_number: t.phoneNumber || '',
  service_type: t.serviceType,
  payment_method: t.paymentMethod,
  quantity: t.quantity ?? 1,
  amount: t.amount,
  mpesa_code: t.mpesaCode || '',
  date: t.date,
  time: t.time || '12:00',
  notes: t.notes || '',
});

export async function fetchTransactions(): Promise<Transaction[]> {
  const all: Transaction[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...(data as Row[]).map(fromRow));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  await saveTransactions([tx]);
}

export async function saveTransactions(txns: Transaction[]): Promise<void> {
  for (let i = 0; i < txns.length; i += 500) {
    const { error } = await supabase.from('transactions').insert(txns.slice(i, i + 500).map(toRow));
    if (error) throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

/** Records saved on this device before cloud sync existed. */
export function getLegacyLocalTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearLegacyLocalTransactions() {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

/** Local-time YYYY-MM-DD (avoids UTC shift late at night in Kenya). */
export function localDateStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}
