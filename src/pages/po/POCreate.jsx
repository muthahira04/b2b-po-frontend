import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';

const riskColor = (score) => {
  if (score >= 80) return 'text-green-700 bg-green-100';
  if (score >= 50) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
};

const riskLabel = (score) => {
  if (score >= 80) return 'Reliable';
  if (score >= 50) return 'Average';
  return 'High Risk';
};

export default function POCreate() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    vendorId: '',
    department: '',
    expectedDelivery: '',
    deliveryAddress: '',
    notes: '',
    items: [{ itemId: '', quantity: 1 }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance.get('/vendors').then((r) => {
      const data = r.data.vendors || r.data.data || [];
      const sorted = [...data].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
      setVendors(sorted);
    });
    axiosInstance.get('/items').then((r) => setItems(r.data.items || []));
    axiosInstance.get('/company/budget').then((r) => setDepartments(r.data.data)).catch(() => {});
  }, []);

  const handleItemChange = (idx, field, value) => {
    const updated = [...form.items];
    updated[idx][field] = field === 'quantity' ? Number(value) : value;
    setForm({ ...form, items: updated });
  };

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { itemId: '', quantity: 1 }] });

  const removeItem = (idx) =>
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/po', form);
      navigate(`/po/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create PO');
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendors.find((v) => v._id === form.vendorId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Purchase Order</h1>
      <p className="text-sm text-gray-500 mb-6">
        Create the PO with items and quantities. Once created, send it to the vendor for pricing.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Vendor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={form.vendorId}
            onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            required
          >
            <option value="">Select vendor...</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.businessName} — Risk Score: {v.riskScore ?? 'N/A'} ({riskLabel(v.riskScore)})
              </option>
            ))}
          </select>

          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Top vendors by reliability:</p>
            <div className="flex flex-wrap gap-2">
              {vendors.slice(0, 3).map((v) => (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => setForm({ ...form, vendorId: v._id })}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${
                    form.vendorId === v._id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  ★ {v.businessName}
                  <span className={`ml-1 px-1 rounded text-xs ${riskColor(v.riskScore)}`}>
                    {v.riskScore ?? '?'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedVendor && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${riskColor(selectedVendor.riskScore)}`}>
              Risk score: {selectedVendor.riskScore ?? 'N/A'} — {riskLabel(selectedVendor.riskScore)}
            </div>
          )}
        </div>

        {/* Department + Delivery Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} (Remaining: ₹{d.remaining.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.expectedDelivery}
              onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Items *</label>
              <p className="text-xs text-gray-400">Vendor will provide pricing after receiving this PO</p>
            </div>
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">
              + Add item
            </button>
          </div>

          <div className="flex gap-2 px-2 mb-1 text-xs font-medium text-gray-500">
            <span className="flex-1">Item</span>
            <span className="w-24 text-center">Quantity</span>
            <span className="w-6" />
          </div>

          <div className="space-y-2">
            {form.items.map((entry, idx) => {
              const itemObj = items.find((i) => i._id === entry.itemId);
              return (
                <div key={idx} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={entry.itemId}
                    onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                    required
                  >
                    <option value="">Select item...</option>
                    {items.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.name} ({i.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center"
                    value={entry.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />

                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-600 text-lg w-6 text-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reference prices note */}
          {form.items.some((e) => e.itemId) && (
            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-600 font-medium mb-1">Reference standard prices (from your catalog):</p>
              <div className="space-y-0.5">
                {form.items.filter((e) => e.itemId).map((entry, idx) => {
                  const itemObj = items.find((i) => i._id === entry.itemId);
                  if (!itemObj) return null;
                  return (
                    <p key={idx} className="text-xs text-blue-500">
                      {itemObj.name}: ₹{itemObj.standardPrice}/{itemObj.unit} × {entry.quantity} = est. ₹{(itemObj.standardPrice * entry.quantity).toLocaleString()}
                    </p>
                  );
                })}
              </div>
              <p className="text-xs text-blue-400 mt-1">Actual prices will be set by the vendor when they quote.</p>
            </div>
          )}
        </div>

        {/* Delivery Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            placeholder="Where should the vendor deliver?"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Special requirements, quality specs, packaging instructions..."
          />
        </div>

        {/* Flow reminder */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
          <p className="font-medium text-gray-600 mb-1">What happens next:</p>
          <p>1. PO is saved as <span className="font-medium">Draft</span></p>
          <p>2. You send it to the vendor → status becomes <span className="font-medium">Pending Quote</span></p>
          <p>3. Vendor logs in, enters prices and confirms which items they can supply</p>
          <p>4. You review the quote → submit for internal approval</p>
          <p>5. Approvers approve → vendor fulfills</p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create PO'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/po')}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}