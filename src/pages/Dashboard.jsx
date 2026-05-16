import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const STATUS_COLORS = {
  draft: '#9ca3af',
  pending_approval: '#fbbf24',
  approved: '#34d399',
  rejected: '#f87171',
  fulfilled: '#60a5fa',
};

const CustomTooltipBudget = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill || p.color }}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
      {payload.length >= 2 && (
        <p className="text-gray-500 mt-1 pt-1 border-t border-gray-100">
          Utilization: {Math.round((payload[1]?.value / payload[0]?.value) * 100)}%
        </p>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, draft: 0, pending: 0, approved: 0, fulfilled: 0 });
  const [monthlySpend, setMonthlySpend] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [statusPieData, setStatusPieData] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [posRes, budgetRes] = await Promise.all([
          axiosInstance.get('/po'),
          axiosInstance.get('/company/budget').catch(() => ({ data: { data: [] } })),
        ]);

        const pos = posRes.data.data;

        setStats({
          total: pos.length,
          draft: pos.filter((p) => p.status === 'draft').length,
          pending: pos.filter((p) => p.status === 'pending_approval').length,
          approved: pos.filter((p) => p.status === 'approved').length,
          fulfilled: pos.filter((p) => p.status === 'fulfilled').length,
        });

        const statusCounts = {};
        pos.forEach((p) => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
        setStatusPieData(Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value, key: name })));

        const months = {};
        pos.filter((p) => p.status === 'fulfilled').forEach((p) => {
          const month = new Date(p.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
          months[month] = (months[month] || 0) + p.totalAmount;
        });
        setMonthlySpend(Object.entries(months).slice(-6).map(([month, amount]) => ({ month, amount })));

        const vendorSpend = {};
        pos.forEach((p) => {
          if (p.vendorId?.businessName) vendorSpend[p.vendorId.businessName] = (vendorSpend[p.vendorId.businessName] || 0) + p.totalAmount;
        });
        setTopVendors(
          Object.entries(vendorSpend)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, spend]) => ({ name, spend }))
        );

        const depts = budgetRes.data.data;
        setBudgetData(
          depts.map((d) => ({
            name: d.name,
            Budget: d.monthlyBudget,
            Spent: d.spent,
            Remaining: d.remaining,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (user?.role === 'vendor') {
    window.location.replace('/vendor-dashboard');
    return null;
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total POs',  value: stats.total,     bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-800' },
          { label: 'Draft',      value: stats.draft,     bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700' },
          { label: 'Pending',    value: stats.pending,   bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
          { label: 'Approved',   value: stats.approved,  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700' },
          { label: 'Fulfilled',  value: stats.fulfilled, bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {budgetData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Department Budget Utilization</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltipBudget />} />
              <Legend />
              <Bar dataKey="Budget" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Spent"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {budgetData.map((d) => {
              const pct = Math.min(100, Math.round((d.Spent / d.Budget) * 100));
              const over = pct >= 90;
              return (
                <div key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-gray-600 text-xs truncate">{d.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs w-10 text-right font-medium ${over ? 'text-red-600' : 'text-gray-600'}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Spend (Fulfilled)</h2>
          {monthlySpend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spend" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No fulfilled POs yet</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">PO Status Breakdown</h2>
          {statusPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={160} height={160}>
                <Pie
                  data={statusPieData}
                  cx={75} cy={75}
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusPieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
              <div className="space-y-2">
                {statusPieData.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: STATUS_COLORS[entry.key] || '#9ca3af' }}
                    />
                    <span className="capitalize text-gray-700">{entry.name}</span>
                    <span className="ml-auto font-semibold text-gray-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No POs yet</p>
          )}
        </div>
      </div>

      {topVendors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top Vendors by Spend</h2>
          <div className="space-y-3">
            {topVendors.map((v, i) => {
              const maxSpend = topVendors[0].spend;
              return (
                <div key={v.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <span className="w-36 text-sm text-gray-700 truncate">{v.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-400"
                      style={{ width: `${(v.spend / maxSpend) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-24 text-right">
                    ${v.spend.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}