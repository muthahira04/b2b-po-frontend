import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ShieldOff, Search, Plus } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const getRiskConfig = (score) => {
  if (score >= 80) return {
    label: 'Reliable',
    bg: 'bg-green-100', text: 'text-green-700',
    bar: 'bg-green-500', border: 'border-green-200',
    cardBorder: 'border-green-100',
    Icon: ShieldCheck, iconColor: 'text-green-600'
  };
  if (score >= 50) return {
    label: 'Average',
    bg: 'bg-yellow-100', text: 'text-yellow-700',
    bar: 'bg-yellow-400', border: 'border-yellow-200',
    cardBorder: 'border-yellow-100',
    Icon: ShieldAlert, iconColor: 'text-yellow-500'
  };
  return {
    label: 'High Risk',
    bg: 'bg-red-100', text: 'text-red-700',
    bar: 'bg-red-500', border: 'border-red-200',
    cardBorder: 'border-red-100',
    Icon: ShieldOff, iconColor: 'text-red-600'
  };
};

const RiskBadge = ({ score }) => {
  const cfg = getRiskConfig(score ?? 0);
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} />
      {cfg.label} ({score ?? 'N/A'})
    </span>
  );
};

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axiosInstance.get('/vendors').then((r) => {
      const data = r.data.vendors || r.data.data || [];
      setVendors(data);
    }).catch(() => setVendors([])).finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) => {
    const matchSearch = (v.businessName || v.name || '').toLowerCase().includes(search.toLowerCase());
    const score = v.riskScore ?? 0;
    if (filter === 'reliable') return matchSearch && score >= 80;
    if (filter === 'average')  return matchSearch && score >= 50 && score < 80;
    if (filter === 'highrisk') return matchSearch && score < 50;
    return matchSearch;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const reliable = vendors.filter((v) => (v.riskScore ?? 0) >= 80).length;
  const average  = vendors.filter((v) => (v.riskScore ?? 0) >= 50 && (v.riskScore ?? 0) < 80).length;
  const highRisk = vendors.filter((v) => (v.riskScore ?? 0) < 50).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <Link
          to="/vendors/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={15} /> Add Vendor
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Reliable',  count: reliable,  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  bar: 'bg-green-500',  key: 'reliable',  Icon: ShieldCheck },
          { label: 'Average',   count: average,   bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-400', key: 'average',   Icon: ShieldAlert },
          { label: 'High Risk', count: highRisk,  bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    bar: 'bg-red-500',    key: 'highrisk',  Icon: ShieldOff },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(filter === c.key ? 'all' : c.key)}
            className={`${c.bg} border ${c.border} rounded-xl p-4 text-left hover:opacity-90 transition-all ${filter === c.key ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <c.Icon size={14} className={c.text} />
              <span className={`text-sm font-semibold ${c.text}`}>{c.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {c.key === 'reliable' ? 'Score 80–100' : c.key === 'average' ? 'Score 50–79' : 'Score below 50'}
            </p>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search vendors..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => {
          const cfg = getRiskConfig(v.riskScore ?? 0);
          const { Icon } = cfg;
          return (
            <Link key={v._id} to={`/vendors/${v._id}/edit`} className="block">
              <div className={`bg-white border ${cfg.cardBorder} rounded-xl p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{v.businessName || v.name}</h3>
                  <RiskBadge score={v.riskScore} />
                </div>
                <p className="text-sm text-gray-500 mb-3">{v.email || v.contactPerson || '—'}</p>

                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Icon size={11} className={cfg.iconColor} /> Risk score
                  </span>
                  <span className={cfg.text}>{v.riskScore ?? 0}/100</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${cfg.bar} transition-all`}
                    style={{ width: `${v.riskScore ?? 0}%` }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="block text-gray-400">Total orders</span>
                    <span className="font-medium text-gray-700">{v.totalOrders ?? 0}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">On-time deliveries</span>
                    <span className="font-medium text-gray-700">{v.onTimeDeliveries ?? 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No vendors found.</div>
        )}
      </div>
    </div>
  );
}