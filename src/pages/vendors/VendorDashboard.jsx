import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PackageCheck, Clock, Truck, Eye, CheckCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  fulfilled: 'bg-blue-100 text-blue-700',
};

export default function VendorDashboard() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState('');

  const fetchPOs = () => {
    axiosInstance.get('/po').then((r) => setPos(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPOs(); }, []);

  const handleFulfill = async (id) => {
    setFulfilling(id);
    try {
      await axiosInstance.put(`/po/${id}/fulfill`);
      fetchPOs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fulfill');
    } finally {
      setFulfilling('');
    }
  };

  const approved  = pos.filter((p) => p.status === 'approved');
  const fulfilled = pos.filter((p) => p.status === 'fulfilled');
  const pending   = pos.filter((p) => p.status === 'pending_approval');

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Vendor Portal</h1>
      <p className="text-gray-500 mb-6 text-sm">Purchase orders assigned to your account</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={15} className="text-yellow-600" />
            <p className="text-sm text-yellow-600 font-medium">Pending Approval</p>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{pending.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <PackageCheck size={15} className="text-green-600" />
            <p className="text-sm text-green-600 font-medium">Ready to Fulfill</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{approved.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={15} className="text-blue-600" />
            <p className="text-sm text-blue-600 font-medium">Fulfilled</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{fulfilled.length}</p>
        </div>
      </div>

      {approved.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Action Required — Ready to Fulfill
          </h2>
          <div className="space-y-3">
            {approved.map((po) => (
              <div
                key={po._id}
                className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">{po.poNumber}</p>
                  <p className="text-sm text-gray-600">
                    ${po.totalAmount?.toLocaleString()} —{' '}
                    {po.deliveryDate
                      ? `Deliver by ${new Date(po.deliveryDate).toLocaleDateString()}`
                      : 'No deadline set'}
                  </p>
                  {po.notes && (
                    <p className="text-xs text-gray-500 mt-1">{po.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Link
                    to={`/po/${po._id}`}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Eye size={13} /> View
                  </Link>
                  <button
                    onClick={() => handleFulfill(po._id)}
                    disabled={fulfilling === po._id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <Truck size={14} />
                    {fulfilling === po._id ? 'Processing...' : 'Mark Fulfilled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">All Orders</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">PO Number</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Delivery Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{po.poNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[po.status]}`}>
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    ${po.totalAmount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/po/${po._id}`}
                      className="flex items-center justify-end gap-1 text-blue-600 hover:underline text-xs"
                    >
                      <Eye size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No orders assigned yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}