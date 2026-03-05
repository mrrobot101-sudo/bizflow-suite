import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, ShoppingCart, CreditCard, PlusCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getTransactions } from '@/services/transactionService';
import { SERVICE_LABELS, Transaction } from '@/types/transaction';
import StatCard from '@/components/StatCard';

export default function Dashboard() {
  const [transactions] = useState<Transaction[]>(() => getTransactions());

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const todayTxns = transactions.filter(t => t.date === today);
    const monthTxns = transactions.filter(t => t.date.startsWith(currentMonth));

    const dailyRevenue = todayTxns.reduce((s, t) => s + t.amount, 0);
    const monthlyRevenue = monthTxns.reduce((s, t) => s + t.amount, 0);
    const cashTotal = monthTxns.filter(t => t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0);
    const mpesaTotal = monthTxns.filter(t => t.paymentMethod === 'mpesa').reduce((s, t) => s + t.amount, 0);

    return { dailyRevenue, monthlyRevenue, totalTxns: monthTxns.length, cashTotal, mpesaTotal, todayTxns: todayTxns.length };
  }, [transactions, today, currentMonth]);

  const paymentData = [
    { name: 'Cash', value: stats.cashTotal },
    { name: 'M-Pesa', value: stats.mpesaTotal },
  ];

  const serviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    const monthTxns = transactions.filter(t => t.date.startsWith(currentMonth));
    monthTxns.forEach(t => {
      counts[t.serviceType] = (counts[t.serviceType] || 0) + t.amount;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({ name: SERVICE_LABELS[key as keyof typeof SERVICE_LABELS] || key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions, currentMonth]);

  const COLORS = ['hsl(145, 63%, 32%)', 'hsl(35, 90%, 55%)'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/add"
          className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <PlusCircle size={18} />
          <span className="hidden sm:inline">New Sale</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Today" value={`KES ${stats.dailyRevenue.toLocaleString()}`} icon={DollarSign} trend={`${stats.todayTxns} sales`} variant="primary" />
        <StatCard title="This Month" value={`KES ${stats.monthlyRevenue.toLocaleString()}`} icon={TrendingUp} trend={`${stats.totalTxns} transactions`} />
        <StatCard title="Cash" value={`KES ${stats.cashTotal.toLocaleString()}`} icon={CreditCard} />
        <StatCard title="M-Pesa" value={`KES ${stats.mpesaTotal.toLocaleString()}`} icon={ShoppingCart} variant="accent" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-heading font-semibold mb-4 text-sm">Top Services (This Month)</h3>
          {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(145, 63%, 32%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">No data yet. Add your first sale!</p>
          )}
        </div>

        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-heading font-semibold mb-4 text-sm">Payment Split</h3>
          {stats.cashTotal + stats.mpesaTotal > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">No payment data yet.</p>
          )}
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Cash</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-accent inline-block" /> M-Pesa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
