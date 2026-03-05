import { useState, useMemo } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { getTransactions, deleteTransaction } from '@/services/transactionService';
import { SERVICE_LABELS, Transaction, PaymentMethod } from '@/types/transaction';
import { toast } from 'sonner';

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions());
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | PaymentMethod>('all');
  const [filterDate, setFilterDate] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterPayment !== 'all' && t.paymentMethod !== filterPayment) return false;
      if (filterDate && t.date !== filterDate) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.customerName.toLowerCase().includes(q) || t.phoneNumber.includes(q) || SERVICE_LABELS[t.serviceType].toLowerCase().includes(q);
      }
      return true;
    });
  }, [transactions, search, filterPayment, filterDate]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
    toast.success('Transaction deleted');
  };

  const inputClass = "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading font-bold">Transactions</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputClass} pl-9 w-full`} placeholder="Search customer, service..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={inputClass} value={filterPayment} onChange={e => setFilterPayment(e.target.value as 'all' | PaymentMethod)}>
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
        </select>
        <input type="date" className={inputClass} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table / Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground text-sm">
            No transactions found.
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="bg-card border rounded-xl p-3 flex items-center gap-3 animate-fade-in">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                t.paymentMethod === 'mpesa' ? 'gradient-accent text-accent-foreground' : 'gradient-primary text-primary-foreground'
              }`}>
                {t.paymentMethod === 'mpesa' ? 'MP' : 'CA'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.customerName}</p>
                <p className="text-xs text-muted-foreground">{SERVICE_LABELS[t.serviceType]} &middot; {t.date} {t.time}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading font-bold text-sm">KES {t.amount.toLocaleString()}</p>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
