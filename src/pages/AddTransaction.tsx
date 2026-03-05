import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { saveTransaction, generateId } from '@/services/transactionService';
import { SERVICE_LABELS, ServiceType, PaymentMethod } from '@/types/transaction';

export default function AddTransaction() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: '',
    phoneNumber: '',
    serviceType: 'printing' as ServiceType,
    paymentMethod: 'cash' as PaymentMethod,
    amount: '',
    notes: '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.customerName.trim();
    const amount = parseFloat(form.amount);

    if (!name || name.length > 100) {
      toast.error('Enter a valid customer name (max 100 chars)');
      return;
    }
    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
      toast.error('Enter a valid amount (1 - 1,000,000)');
      return;
    }

    const now = new Date();
    saveTransaction({
      id: generateId(),
      customerName: name,
      phoneNumber: form.phoneNumber.trim().slice(0, 15),
      serviceType: form.serviceType,
      paymentMethod: form.paymentMethod,
      amount,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      notes: form.notes.trim().slice(0, 200),
    });

    toast.success('Transaction saved!');
    navigate('/');
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-6">Record Sale</h1>
      <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-5 space-y-4 animate-fade-in">
        <div>
          <label className={labelClass}>Customer Name *</label>
          <input className={inputClass} value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="e.g. John Kamau" required maxLength={100} />
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input className={inputClass} value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} placeholder="e.g. 0712345678" maxLength={15} />
        </div>
        <div>
          <label className={labelClass}>Service *</label>
          <select className={inputClass} value={form.serviceType} onChange={e => update('serviceType', e.target.value)}>
            {Object.entries(SERVICE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount (KES) *</label>
          <input className={inputClass} type="number" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="e.g. 50" min="1" max="1000000" required />
        </div>
        <div>
          <label className={labelClass}>Payment Method *</label>
          <div className="grid grid-cols-2 gap-2">
            {(['cash', 'mpesa'] as const).map(method => (
              <button
                key={method}
                type="button"
                onClick={() => update('paymentMethod', method)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  form.paymentMethod === method
                    ? method === 'mpesa' ? 'gradient-accent text-accent-foreground border-transparent' : 'gradient-primary text-primary-foreground border-transparent'
                    : 'border-input bg-background text-foreground hover:bg-muted'
                }`}
              >
                {method === 'mpesa' ? 'M-Pesa' : 'Cash'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <input className={inputClass} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="e.g. 5 pages, color" maxLength={200} />
        </div>
        <button type="submit" className="w-full gradient-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
          Save Transaction
        </button>
      </form>
    </div>
  );
}
