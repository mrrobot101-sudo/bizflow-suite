import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, ShoppingCart, CreditCard, PlusCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getTransactions, localDateStr } from '@/services/transactionService';
import { SERVICE_LABELS, Transaction } from '@/types/transaction';
import StatCard from '@/components/StatCard';

export default function Dashboard() {
  const [transactions] = useState<Transaction[]>(() => getTransactions());

  const today = localDateStr();
  const currentMonth = today.slice(0, 7);

  const trendData = useMemo(() => {
    const byDay: Record<string, number> = {};
    transactions.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + t.amount; });
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = localDateStr(d);
      return { name: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), value: byDay[key] || 0 };
    });
  }, [transactions]);

  const recent = transactions.slice(0, 5);

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

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))'];

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

      {/* Revenue trend */}
      <div className="bg-card border rounded-xl p-4">
        <h3 className="font-heading font-semibold mb-4 text-sm">Revenue — Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} width={45} />
            <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
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
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
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

      {/* Recent */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm">Recent Sales</h3>
          <Link to="/transactions" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No sales recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {recent.map(t => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.customerName}</p>
                  <p className="text-xs text-muted-foreground">{SERVICE_LABELS[t.serviceType]} · {t.date} · {t.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}</p>
                </div>
                <span className="font-heading font-bold shrink-0">KES {t.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
