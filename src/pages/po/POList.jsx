import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance.jsx';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  sent_to_vendor: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-purple-100 text-purple-700',
  partially_fulfilled: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-gray-100 text-gray-500'
};

const POList = () => {
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      const res = await axiosInstance.get('/po');
      setPOs(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Loading purchase orders...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Link
          to="/po/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create PO
        </Link>
      </div>

      {/* PO Table */}
      {pos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No purchase orders yet. Create your first PO!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">PO Number</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Vendor</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pos.map((po) => (
                <tr key={po._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-600">{po.poNumber}</td>
                  <td className="px-6 py-4 text-gray-700">{po.vendorId?.businessName || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-700">₹{po.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[po.status]}`}>
                      {po.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(po.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/po/${po._id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default POList;