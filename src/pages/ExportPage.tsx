import { useState, useMemo } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { exportToExcel, exportToCsv } from '@/utils/exportUtils';
import { toast } from 'sonner';

export default function ExportPage() {
  const { transactions } = useTransactions();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  const handleExport = (type: 'excel' | 'csv') => {
    if (filtered.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    const label = dateFrom || dateTo ? `CyberMIS_${dateFrom || 'start'}_to_${dateTo || 'today'}` : `CyberMIS_All`;
    if (type === 'excel') exportToExcel(filtered, label);
    else exportToCsv(filtered, label);
    toast.success(`Exported ${filtered.length} records as ${type.toUpperCase()}`);
  };

  const inputClass = "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold">Export Reports</h1>

      <div className="bg-card border rounded-xl p-5 space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">From</label>
            <input type="date" className={`${inputClass} w-full`} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">To</label>
            <input type="date" className={`${inputClass} w-full`} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{filtered.length} transactions will be exported</p>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleExport('excel')} className="gradient-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <FileSpreadsheet size={18} />
            Excel (.xlsx)
          </button>
          <button onClick={() => handleExport('csv')} className="border border-input bg-background text-foreground py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors">
            <FileText size={18} />
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}
