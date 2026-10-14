import { Transaction } from '@/types/transaction';

const STORAGE_KEY = 'cyber-mis-transactions';

export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const list: Transaction[] = JSON.parse(data);
    return list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  } catch {
    return [];
  }
}

export function saveTransaction(tx: Transaction): void {
  const all = getTransactions();
  all.unshift(tx);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function saveTransactions(txns: Transaction[]): void {
  const all = getTransactions();
  all.unshift(...txns);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateTransaction(tx: Transaction): void {
  const all = getTransactions().map(t => (t.id === tx.id ? tx : t));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Local-time YYYY-MM-DD (avoids UTC shift late at night in Kenya). */
export function localDateStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function deleteTransaction(id: string): void {
  const all = getTransactions().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function generateId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}
