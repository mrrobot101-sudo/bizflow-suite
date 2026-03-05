import { Transaction } from '@/types/transaction';

const STORAGE_KEY = 'cyber-mis-transactions';

export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
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

export function deleteTransaction(id: string): void {
  const all = getTransactions().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function generateId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}
