import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Send, Truck, AlertTriangle
} from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  fulfilled: 'bg-blue-100 text-blue-700',
};

const ApprovalIcon = ({ status }) => {
  if (status === 'approved') return <CheckCircle size={18} className="text-green-600" />;
  if (status === 'rejected') return <XCircle size={18} className="text-red-600" />;
  return <Clock size={18} className="text-yellow-500" />;
};

export default function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetchPO = async () => {
    try {
      const res = await axiosInstance.get(`/po/${id}`);
      setPo(res.data.data);
    } catch {
      setError('Failed to load PO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPO(); }, [id]);

  const handleAction = async (action) => {
    setActionLoading(action);
    setError('');
    try {
      await axiosInstance.put(`/po/${id}/${action}`);
      await fetchPO();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !po) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!po) return null;

  const myApprovalEntry = po.approvalChain?.find(
    (a) => a.approverId?._id === user?.id || a.approverId?.toString() === user?.id
  );
  const canApprove = po.status === 'pending_approval' && myApprovalEntry?.status === 'pending';
  const canSubmit = po.status === 'draft' && ['admin', 'manager', 'superadmin'].includes(user?.role);
  const canFulfill = po.status === 'approved' && (user?.role === 'vendor' || user?.role === 'admin');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/po')}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-1"
          >
            <ArrowLeft size={14} /> Back to POs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[po.status]}`}>
          {po.status.replace('_', ' ')}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {canSubmit && (
          <button
            onClick={() => handleAction('submit')}
            disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            <Send size={15} />
            {actionLoading === 'submit' ? 'Submitting...' : 'Submit for Approval'}
          </button>
        )}
        {canApprove && (
          <>
            <button
              onClick={() => handleAction('approve')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              <CheckCircle size={15} />
              {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              <XCircle size={15} />
              {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}
        {canFulfill && (
          <button
            onClick={() => handleAction('fulfill')}
            disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
          >
            <Truck size={15} />
            {actionLoading === 'fulfill' ? 'Marking fulfilled...' : 'Mark as Fulfilled'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Vendor</h2>
         <p className="font-semibold text-gray-900">{po.vendorId?.businessName}</p>
          <p className="text-sm text-gray-600">{po.vendorId?.email}</p>
          {po.vendorId?.riskScore !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              po.vendorId.riskScore >= 80 ? 'bg-green-100 text-green-700'
              : po.vendorId.riskScore >= 50 ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
            }`}>
              Risk score: {po.vendorId.riskScore}
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Details</h2>
          <p className="text-sm text-gray-600">Created by: <span className="text-gray-900">{po.createdBy?.name}</span></p>
          {po.department && (
            <p className="text-sm text-gray-600">Department: <span className="text-gray-900">{po.department}</span></p>
          )}
          {po.expectedDelivery && (
            <p className="text-sm text-gray-600">Delivery: <span className="text-gray-900">{new Date(po.expectedDelivery).toLocaleDateString()}</span></p>
          )}
          <p className="text-sm text-gray-600">Created: <span className="text-gray-900">{new Date(po.createdAt).toLocaleDateString()}</span></p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-2 text-gray-500 font-medium">Item</th>
              <th className="text-right pb-2 text-gray-500 font-medium">Qty</th>
              <th className="text-right pb-2 text-gray-500 font-medium">Unit Price</th>
              <th className="text-right pb-2 text-gray-500 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.items?.map((entry, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-2 text-gray-900">{entry.name || 'Unknown'}</td>
                <td className="py-2 text-right text-gray-700">{entry.quantity} {entry.unit}</td>
                <td className="py-2 text-right text-gray-700">${entry.unitPrice?.toLocaleString()}</td>
                <td className="py-2 text-right font-medium text-gray-900">${entry.totalPrice?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700">Total Amount</td>
              <td className="pt-3 text-right text-xl font-bold text-gray-900">${po.totalAmount?.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {po.approvalChain && po.approvalChain.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Approval Chain</h2>
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {po.approvalChain.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${step.status === 'approved' ? 'bg-green-100' : step.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <ApprovalIcon status={step.status} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {step.approverId?.name || step.name || 'Unknown Approver'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{step.role}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          step.status === 'approved' ? 'bg-green-100 text-green-700'
                          : step.status === 'rejected' ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {step.status}
                        </span>
                        {step.timestamp && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(step.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {myApprovalEntry && step.approverId?._id === myApprovalEntry.approverId?._id && step.status === 'pending' && (
                      <p className="text-xs text-blue-600 font-medium mt-1">Your approval needed</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {po.notes && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm text-gray-700">{po.notes}</p>
        </div>
      )}
    </div>
  );
}