import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { saveTransaction, saveTransactions, generateId } from '@/services/transactionService';
import { useQueryClient } from '@tanstack/react-query';
import { TX_KEY } from '@/hooks/useTransactions';
import { SERVICE_LABELS, ServiceType, PaymentMethod, Transaction } from '@/types/transaction';
import { downloadImportTemplate } from '@/utils/exportUtils';
import { parseImportFile } from '@/utils/importUtils';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Upload, History, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface BulkRow {
  key: string;
  customerName: string;
  serviceType: ServiceType;
  amount: string;
  paymentMethod: PaymentMethod;
  date: Date;
}

const emptyRow = (): BulkRow => ({
  key: Math.random().toString(36).substr(2, 8),
  customerName: '',
  serviceType: 'printing',
  amount: '',
  paymentMethod: 'cash',
  date: new Date(),
});

export default function AddTransaction() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [historicalMode, setHistoricalMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5));

  // Single entry form
  const [form, setForm] = useState({
    customerName: '',
    phoneNumber: '',
    serviceType: 'printing' as ServiceType,
    paymentMethod: 'cash' as PaymentMethod,
    amount: '',
    quantity: '1',
    mpesaCode: '',
    notes: '',
  });

  // Bulk entry
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
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
    const code = form.mpesaCode.trim().toUpperCase();
    if (form.paymentMethod === 'mpesa' && code && !/^[A-Z0-9]{8,12}$/.test(code)) {
      toast.error('M-Pesa code should be 8–12 letters/numbers (e.g. SBK1A2B3C4)');
      return;
    }
    if (selectedDate > today) {
      toast.error('Date cannot be in the future');
      return;
    }

    setSaving(true);
    try {
    await saveTransaction({
      id: generateId(),
      customerName: name,
      phoneNumber: form.phoneNumber.trim().slice(0, 15),
      serviceType: form.serviceType,
      paymentMethod: form.paymentMethod,
      amount,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      notes: form.notes.trim().slice(0, 200),
      quantity: Math.max(1, parseInt(form.quantity) || 1),
      mpesaCode: form.paymentMethod === 'mpesa' ? code : '',
    });

    } catch (err: any) {
      setSaving(false);
      toast.error(err.message || 'Could not save. Check your connection.');
      return;
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: TX_KEY });
    toast.success('Transaction saved!');
    if (!historicalMode) {
      navigate('/');
    } else {
      setForm(f => ({ ...f, customerName: '', phoneNumber: '', amount: '', quantity: '1', mpesaCode: '', notes: '' }));
    }
  };

  // Bulk entry handlers
  const updateBulkRow = (index: number, field: keyof BulkRow, value: any) => {
    setBulkRows(rows => rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const addBulkRow = () => setBulkRows(rows => [...rows, emptyRow()]);

  const removeBulkRow = (index: number) => {
    if (bulkRows.length <= 1) return;
    setBulkRows(rows => rows.filter((_, i) => i !== index));
  };

  const handleBulkSubmit = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const valid: Transaction[] = [];
    const errors: number[] = [];

    bulkRows.forEach((row, i) => {
      const name = row.customerName.trim();
      const amount = parseFloat(row.amount);
      const dateStr = format(row.date, 'yyyy-MM-dd');

      if (!name || isNaN(amount) || amount <= 0 || dateStr > todayStr) {
        if (name || row.amount) errors.push(i + 1);
        return;
      }

      valid.push({
        id: generateId() + '-' + Math.random().toString(36).substr(2, 3),
        customerName: name.slice(0, 100),
        phoneNumber: '',
        serviceType: row.serviceType,
        paymentMethod: row.paymentMethod,
        amount,
        date: dateStr,
        time: '12:00',
        notes: '',
      });
    });

    if (valid.length === 0) {
      toast.error('No valid rows to save. Check names, amounts and dates.');
      return;
    }

    try {
      await saveTransactions(valid);
    } catch (err: any) {
      toast.error(err.message || 'Could not save');
      return;
    }
    qc.invalidateQueries({ queryKey: TX_KEY });
    toast.success(`Saved ${valid.length} transaction${valid.length > 1 ? 's' : ''}!`);
    if (errors.length > 0) {
      toast.warning(`Skipped row${errors.length > 1 ? 's' : ''} ${errors.join(', ')} (invalid data)`);
    }
    setBulkRows([emptyRow(), emptyRow(), emptyRow()]);
  };

  // File import
  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const transactions = await parseImportFile(file);
      if (transactions.length === 0) {
        toast.error('No valid transactions found in file');
        return;
      }
      await saveTransactions(transactions);
      qc.invalidateQueries({ queryKey: TX_KEY });
      toast.success(`Imported ${transactions.length} transaction${transactions.length > 1 ? 's' : ''}!`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [qc]);

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Record Sale</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <History size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground hidden sm:inline">Historical Mode</span>
            <Switch checked={historicalMode} onCheckedChange={setHistoricalMode} />
          </label>
        </div>
      </div>

      {historicalMode && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-sm text-accent-foreground flex items-start gap-2 animate-fade-in">
          <History size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>Historical mode — quickly add backdated records. Date defaults to today but can be changed per entry.</span>
        </div>
      )}

      {/* Single Entry Form */}
      <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-5 space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Customer Name *</label>
            <input className={inputClass} value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="e.g. John Kamau" required maxLength={100} />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input className={inputClass} value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} placeholder="e.g. 0712345678" maxLength={15} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Service *</label>
            <select className={inputClass} value={form.serviceType} onChange={e => update('serviceType', e.target.value)}>
              {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[0.6fr_1fr] gap-2">
            <div>
              <label className={labelClass}>Qty</label>
              <input className={inputClass} type="number" inputMode="numeric" value={form.quantity} onChange={e => update('quantity', e.target.value)} min="1" max="10000" />
            </div>
            <div>
              <label className={labelClass}>Total (KES) *</label>
              <input className={inputClass} type="number" inputMode="decimal" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="e.g. 50" min="1" max="1000000" required />
            </div>
          </div>
        </div>

        {/* Date and Time Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={cn(inputClass, "flex items-center justify-between text-left", !selectedDate && "text-muted-foreground")}>
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  disabled={(date) => date > today}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input type="time" className={inputClass} value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
          </div>
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

        {form.paymentMethod === 'mpesa' && (
          <div className="animate-fade-in">
            <label className={labelClass}>M-Pesa Transaction Code</label>
            <input className={cn(inputClass, 'uppercase tracking-wider')} value={form.mpesaCode} onChange={e => update('mpesaCode', e.target.value.toUpperCase())} placeholder="e.g. SBK1A2B3C4" maxLength={12} />
          </div>
        )}

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <input className={inputClass} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="e.g. 5 pages, color" maxLength={200} />
        </div>

        <button type="submit" disabled={saving} className="w-full disabled:opacity-60 gradient-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
          {saving ? 'Saving…' : 'Save Transaction'}
        </button>
      </form>

      {/* Bulk Entry Section — only in Historical Mode */}
      {historicalMode && (
        <div className="bg-card border rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-lg">Bulk Entry</h2>
            <button type="button" onClick={addBulkRow} className="flex items-center gap-1 text-sm text-primary hover:underline">
              <PlusCircle size={15} /> Add Row
            </button>
          </div>

          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_0.7fr_0.7fr_0.8fr_40px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            <span>Customer</span>
            <span>Service</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Date</span>
            <span></span>
          </div>

          {bulkRows.map((row, i) => (
            <div key={row.key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_0.7fr_0.7fr_0.8fr_40px] gap-2 items-center">
              <input
                className="px-2 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Customer"
                value={row.customerName}
                onChange={e => updateBulkRow(i, 'customerName', e.target.value)}
                maxLength={100}
              />
              <select
                className="px-2 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={row.serviceType}
                onChange={e => updateBulkRow(i, 'serviceType', e.target.value)}
              >
                {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input
                className="px-2 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                type="number"
                placeholder="KES"
                value={row.amount}
                onChange={e => updateBulkRow(i, 'amount', e.target.value)}
                min="1"
                max="1000000"
              />
              <select
                className="px-2 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={row.paymentMethod}
                onChange={e => updateBulkRow(i, 'paymentMethod', e.target.value as PaymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
              </select>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="px-2 py-2 rounded-lg border border-input bg-background text-sm text-left flex items-center justify-between gap-1 focus:outline-none focus:ring-1 focus:ring-ring">
                    <span className="truncate">{format(row.date, 'dd/MM/yy')}</span>
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={row.date}
                    onSelect={(d) => d && updateBulkRow(i, 'date', d)}
                    disabled={(date) => date > today}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <button type="button" onClick={() => removeBulkRow(i)} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Remove row">
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <button type="button" onClick={handleBulkSubmit} className="w-full gradient-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            Save All ({bulkRows.filter(r => r.customerName.trim() && r.amount).length} entries)
          </button>
        </div>
      )}

      {/* Import Section — only in Historical Mode */}
      {historicalMode && (
        <div className="bg-card border rounded-xl p-5 space-y-3 animate-fade-in">
          <h2 className="font-heading font-semibold text-lg">Import from Spreadsheet</h2>
          <p className="text-sm text-muted-foreground">
            Upload an Excel (.xlsx) or CSV file with columns: <strong>Customer, Service, Amount, Payment, Date</strong> (optional: Phone, Quantity, M-Pesa Code, Time, Notes).
          </p>
          <button type="button" onClick={downloadImportTemplate} className="text-sm text-primary hover:underline">
            Download sample template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-input bg-muted/30 text-foreground py-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          >
            <Upload size={18} />
            Choose File to Import
          </button>
        </div>
      )}
    </div>
  );
}
