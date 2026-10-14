import { useState, useMemo } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import { getTransactions, deleteTransaction } from '@/services/transactionService';
import { SERVICE_LABELS, Transaction, PaymentMethod, ServiceType } from '@/types/transaction';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PAGE_SIZE = 50;

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions());
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | PaymentMethod>('all');
  const [filterService, setFilterService] = useState<'all' | ServiceType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter(t => {
      if (filterPayment !== 'all' && t.paymentMethod !== filterPayment) return false;
      if (filterService !== 'all' && t.serviceType !== filterService) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (q) {
        return (
          t.customerName.toLowerCase().includes(q) ||
          t.phoneNumber.includes(q) ||
          (t.mpesaCode || '').toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q) ||
          SERVICE_LABELS[t.serviceType].toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, search, filterPayment, filterService, dateFrom, dateTo]);

  const total = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);
  const hasFilters = search || filterPayment !== 'all' || filterService !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch(''); setFilterPayment('all'); setFilterService('all'); setDateFrom(''); setDateTo('');
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteTransaction(pendingDelete.id);
    setTransactions(getTransactions());
    toast.success('Transaction deleted');
    setPendingDelete(null);
  };

  const inputClass = "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading font-bold">Transactions</h1>

      <div className="bg-card border rounded-xl p-3 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputClass} pl-9 w-full`} placeholder="Search customer, phone, M-Pesa code, notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select className={inputClass} value={filterPayment} onChange={e => setFilterPayment(e.target.value as 'all' | PaymentMethod)}>
            <option value="all">All payments</option>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
          </select>
          <select className={inputClass} value={filterService} onChange={e => setFilterService(e.target.value as 'all' | ServiceType)}>
            <option value="all">All services</option>
            {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" aria-label="From date" className={inputClass} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <input type="date" aria-label="To date" className={inputClass} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} · <span className="font-semibold text-foreground">KES {total.toLocaleString()}</span>
        </p>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-primary hover:underline">
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground text-sm">
            {transactions.length === 0 ? 'No transactions yet. Record your first sale!' : 'No transactions match your filters.'}
          </div>
        ) : (
          filtered.slice(0, limit).map(t => (
            <div key={t.id} className="bg-card border rounded-xl p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                t.paymentMethod === 'mpesa' ? 'gradient-accent text-accent-foreground' : 'gradient-primary text-primary-foreground'
              }`}>
                {t.paymentMethod === 'mpesa' ? 'MP' : 'CA'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.customerName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {SERVICE_LABELS[t.serviceType]}{t.quantity && t.quantity > 1 ? ` ×${t.quantity}` : ''} · {t.date} {t.time}
                  {t.mpesaCode ? ` · ${t.mpesaCode}` : ''}
                </p>
              </div>
              <p className="font-heading font-bold text-sm shrink-0">KES {t.amount.toLocaleString()}</p>
              <button onClick={() => setPendingDelete(t)} aria-label="Delete transaction" className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
        {filtered.length > limit && (
          <button onClick={() => setLimit(l => l + PAGE_SIZE)} className="w-full py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
            Show more ({filtered.length - limit} remaining)
          </button>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={o => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && `${pendingDelete.customerName} — KES ${pendingDelete.amount.toLocaleString()} on ${pendingDelete.date}. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
