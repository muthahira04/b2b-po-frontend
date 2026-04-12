import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance.jsx';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle, XCircle, Send, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

const PODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPO();
  }, [id]);

  const fetchPO = async () => {
    try {
      const res = await axiosInstance.get(`/po/${id}`);
      setPO(res.data.po);
    } catch (error) {
      toast.error('Failed to fetch PO');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await axiosInstance.post(`/po/${id}/submit`);
      toast.success('PO submitted for approval');
      fetchPO();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit PO');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await axiosInstance.post(`/po/${id}/approve`, { comment });
      toast.success('PO approved successfully');
      setComment('');
      fetchPO();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve PO');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await axiosInstance.post(`/po/${id}/reject`, { comment });
      toast.success('PO rejected');
      setComment('');
      fetchPO();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject PO');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfill = async () => {
    setActionLoading(true);
    try {
      const receivedItems = po.items.map(item => ({
        itemId: item._id,
        receivedQty: item.quantity
      }));
      await axiosInstance.post(`/po/${id}/fulfill`, {
        receivedItems,
        vendorInvoiceNo: `INV-${Date.now()}`
      });
      toast.success('PO marked as fulfilled');
      fetchPO();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fulfill PO');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Loading PO details...</p>
    </div>
  );

  if (!po) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">PO not found</p>
    </div>
  );

  const isApprover = user?.role === 'admin' || user?.role === 'approver';
  const isPendingApproval = po.status === 'pending_approval';
  const isDraft = po.status === 'draft';
  const isApproved = po.status === 'approved';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/po')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[po.status]}`}>
              {po.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={16} />
              Submit for Approval
            </button>
          )}
          {isApproved && (
            <button
              onClick={handleFulfill}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Package size={16} />
              Mark Fulfilled
            </button>
          )}
        </div>
      </div>

      {/* PO Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Order Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Vendor</span>
              <span className="text-sm font-medium">{po.vendorId?.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Created By</span>
              <span className="text-sm font-medium">{po.createdBy?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Expected Delivery</span>
              <span className="text-sm font-medium">
                {new Date(po.expectedDelivery).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Delivery Address</span>
              <span className="text-sm font-medium">{po.deliveryAddress}</span>
            </div>
            {po.notes && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Notes</span>
                <span className="text-sm font-medium">{po.notes}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total Amount</span>
              <span className="text-sm font-bold text-gray-900">
                ₹{po.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Approval Timeline */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Approval Timeline</h2>
          {po.approvalChain?.length === 0 ? (
            <p className="text-sm text-gray-400">No approval chain yet. Submit PO first.</p>
          ) : (
            <div className="space-y-4">
              {po.approvalChain?.map((entry, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.status === 'approved' ? 'bg-green-100' :
                    entry.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {entry.status === 'approved' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : entry.status === 'rejected' ? (
                      <XCircle size={16} className="text-red-600" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.approverId?.name || 'Approver'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{entry.status}</p>
                    {entry.comment && (
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded">
                        "{entry.comment}"
                      </p>
                    )}
                    {entry.actionAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(entry.actionAt).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Item</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Qty</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Unit</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Unit Price</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.items?.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.totalPrice?.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approve / Reject Section */}
      {isPendingApproval && isApprover && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Approval Action</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (required for rejection)"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle size={18} />
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle size={18} />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PODetail;