import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import {
  ArrowLeft, Edit, ShieldCheck, ShieldAlert, ShieldOff,
  Package, TrendingUp, Clock, CheckCircle, XCircle, Truck
} from 'lucide-react';

const getRiskConfig = (score) => {
  if (score >= 80) return {
    label: 'Reliable',
    bg: 'bg-green-100', text: 'text-green-700',
    bar: 'bg-green-500', border: 'border-green-200',
    Icon: ShieldCheck, iconColor: 'text-green-600',
    description: 'This vendor consistently delivers on time and meets quality standards.'
  };
  if (score >= 50) return {
    label: 'Average',
    bg: 'bg-yellow-100', text: 'text-yellow-700',
    bar: 'bg-yellow-400', border: 'border-yellow-200',
    Icon: ShieldAlert, iconColor: 'text-yellow-500',
    description: 'This vendor has mixed delivery performance. Monitor closely.'
  };
  return {
    label: 'High Risk',
    bg: 'bg-red-100', text: 'text-red-700',
    bar: 'bg-red-500', border: 'border-red-200',
    Icon: ShieldOff, iconColor: 'text-red-600',
    description: 'This vendor has poor delivery history. Consider alternatives.'
  };
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_quote: 'bg-orange-100 text-orange-700',
  quoted: 'bg-purple-100 text-purple-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  fulfilled: 'bg-blue-100 text-blue-700',
};

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [vendorPOs, setVendorPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [vendorRes, posRes] = await Promise.all([
          axiosInstance.get(`/vendors/${id}`),
          axiosInstance.get('/po'),
        ]);
        const v = vendorRes.data.vendor;
        setVendor(v);

        // Filter POs belonging to this vendor
        const allPOs = posRes.data.data || [];
        const filtered = allPOs.filter(
          (po) => po.vendorId?._id === id || po.vendorId === id
        );
        setVendorPOs(filtered);
      } catch (err) {
        setError('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!vendor) return null;

  const score = vendor.riskScore ?? 100;
  const cfg = getRiskConfig(score);
  const { Icon } = cfg;

  const totalOrders = vendor.totalOrders ?? 0;
  const onTime = vendor.onTimeDeliveries ?? 0;
  const lateDeliveries = totalOrders - onTime;
  const onTimePct = totalOrders > 0 ? Math.round((onTime / totalOrders) * 100) : null;

  const canEdit = ['admin', 'manager', 'superadmin'].includes(user?.role);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/vendors')}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2"
          >
            <ArrowLeft size={14} /> Back to Vendors
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vendor.category} · {vendor.status}</p>
        </div>
        {canEdit && (
          <Link
            to={`/vendors/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Edit size={14} /> Edit Vendor
          </Link>
        )}
      </div>

      {/* Risk score card */}
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm`}>
              <Icon size={24} className={cfg.iconColor} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Score</p>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${cfg.text}`}>{score}</span>
                <span className="text-gray-400 text-sm mb-1">/100</span>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            {cfg.label}
          </span>
        </div>

        {/* Score bar */}
        <div className="h-3 bg-white rounded-full overflow-hidden mb-3 shadow-inner">
          <div
            className={`h-3 rounded-full ${cfg.bar} transition-all`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Formula explanation */}
        <div className="bg-white bg-opacity-60 rounded-lg px-4 py-3 text-sm">
          <p className="font-medium text-gray-700 mb-1">How this score is calculated:</p>
          <p className="text-gray-600 font-mono text-xs mb-2">
            Risk Score = (On-time Deliveries ÷ Total Orders) × 100
          </p>
          {totalOrders > 0 ? (
            <p className="text-gray-600 text-xs">
              = ({onTime} ÷ {totalOrders}) × 100 = <strong>{score}</strong>
            </p>
          ) : (
            <p className="text-gray-500 text-xs italic">
              No orders yet — score defaults to 100 (new vendor)
            </p>
          )}
          <p className={`mt-2 text-xs ${cfg.text} font-medium`}>{cfg.description}</p>
        </div>
      </div>

      {/* Delivery stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Package size={20} className="text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Orders</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle size={20} className="text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{onTime}</p>
          <p className="text-xs text-gray-500 mt-0.5">On-time Deliveries</p>
          {onTimePct !== null && (
            <p className="text-xs text-green-600 font-medium mt-1">{onTimePct}% on time</p>
          )}
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-4 text-center">
          <XCircle size={20} className="text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{lateDeliveries}</p>
          <p className="text-xs text-gray-500 mt-0.5">Late / Missed</p>
        </div>
      </div>

      {/* Vendor profile info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Vendor Profile</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Contact Person</p>
            <p className="text-gray-900 font-medium">{vendor.contactPerson || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Email</p>
            <p className="text-gray-900 font-medium">{vendor.email || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Phone</p>
            <p className="text-gray-900 font-medium">{vendor.phone || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Category</p>
            <p className="text-gray-900 font-medium">{vendor.category || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">GSTIN</p>
            <p className="text-gray-900 font-medium">{vendor.gstin || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Status</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
              vendor.status === 'active' ? 'bg-green-100 text-green-700'
              : vendor.status === 'blacklisted' ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
            }`}>
              {vendor.status}
            </span>
          </div>
          {vendor.address && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-0.5">Address</p>
              <p className="text-gray-900 font-medium">{vendor.address}</p>
            </div>
          )}
          {vendor.bankDetails?.bankName && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-0.5">Bank Details</p>
              <p className="text-gray-900 font-medium">
                {vendor.bankDetails.bankName} · A/C {vendor.bankDetails.accountNo} · IFSC {vendor.bankDetails.ifsc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* POs assigned to this vendor */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Purchase Orders ({vendorPOs.length})
          </h2>
          {vendorPOs.length > 0 && (
            <span className="text-xs text-gray-400">
              Total value: ₹{vendorPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0).toLocaleString()}
            </span>
          )}
        </div>

        {vendorPOs.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No purchase orders assigned to this vendor yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vendorPOs.map((po) => (
              <Link
                key={po._id}
                to={`/po/${po._id}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{po.poNumber}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(po.createdAt).toLocaleDateString()} · {po.department || 'No dept'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-800">
                    {po.totalAmount > 0 ? `₹${po.totalAmount.toLocaleString()}` : '—'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[po.status] || 'bg-gray-100 text-gray-600'}`}>
                    {po.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}