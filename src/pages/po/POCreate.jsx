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
    items: [{ itemId: '', quantity: 1, unitPrice: '' }],
  });
  const [budgetWarning, setBudgetWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewTotal, setPreviewTotal] = useState(0);
  const [budgetInfo, setBudgetInfo] = useState(null);

  useEffect(() => {
    axiosInstance.get('/vendors').then((r) => {
      const data = r.data.vendors || r.data.data || [];
      const sorted = [...data].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
      setVendors(sorted);
    });
    axiosInstance.get('/items').then((r) => setItems(r.data.items || []));
    axiosInstance.get('/company/budget').then((r) => setDepartments(r.data.data)).catch(() => {});
  }, []);

  // Recalculate preview total using unitPrice from form state
  useEffect(() => {
    let total = 0;
    form.items.forEach(({ unitPrice, quantity }) => {
      const price = Number(unitPrice);
      if (price > 0) total += price * Number(quantity);
    });
    setPreviewTotal(total);

    if (form.department) {
      const dept = departments.find((d) => d.name === form.department);
      if (dept) setBudgetInfo({ ...dept, requested: total });
      else setBudgetInfo(null);
    } else {
      setBudgetInfo(null);
    }
  }, [form.items, form.department, departments]);

  const handleItemChange = (idx, field, value) => {
    const updated = [...form.items];
    if (field === 'quantity') {
      updated[idx][field] = Number(value);
    } else if (field === 'itemId') {
      // Pre-fill unitPrice with standardPrice when item is selected
      const selectedItem = items.find((i) => i._id === value);
      updated[idx].itemId = value;
      updated[idx].unitPrice = selectedItem ? selectedItem.standardPrice : '';
    } else if (field === 'unitPrice') {
      updated[idx][field] = value;
    } else {
      updated[idx][field] = value;
    }
    setForm({ ...form, items: updated });
  };

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { itemId: '', quantity: 1, unitPrice: '' }] });
  const removeItem = (idx) =>
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBudgetWarning(null);
    try {
      const res = await axiosInstance.post('/po', form);
      if (res.data.budgetWarning) {
        setBudgetWarning(res.data.budgetWarning);
      }
      navigate(`/po/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create PO');
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendors.find((v) => v._id === form.vendorId);
  const budgetOver = budgetInfo && budgetInfo.requested > budgetInfo.remaining;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Purchase Order</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {budgetInfo && (
        <div className={`mb-4 px-4 py-3 rounded-lg border ${budgetOver ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`font-semibold text-sm ${budgetOver ? 'text-red-700' : 'text-green-700'}`}>
              {budgetOver ? '⚠ Budget Exceeded' : '✓ Within Budget'} — {budgetInfo.name}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm mt-2">
            <div>
              <p className="text-gray-500">Monthly budget</p>
              <p className="font-semibold text-gray-800">₹{budgetInfo.monthlyBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Already spent</p>
              <p className="font-semibold text-gray-800">₹{budgetInfo.spent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Remaining</p>
              <p className={`font-semibold ${budgetOver ? 'text-red-600' : 'text-green-600'}`}>
                ₹{budgetInfo.remaining.toLocaleString()}
              </p>
            </div>
          </div>
          {budgetOver && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              This PO (₹{previewTotal.toLocaleString()}) exceeds remaining budget by ₹
              {(previewTotal - budgetInfo.remaining).toLocaleString()}. It will still be saved as a draft.
            </p>
          )}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${budgetOver ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, ((budgetInfo.spent + previewTotal) / budgetInfo.monthlyBudget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.expectedDelivery}
              onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Items *</label>
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">
              + Add item
            </button>
          </div>

          {/* Column headers */}
          <div className="flex gap-2 px-2 mb-1 text-xs font-medium text-gray-500">
            <span className="flex-1">Item</span>
            <span className="w-20 text-center">Qty</span>
            <span className="w-28 text-center">Unit Price (₹)</span>
            <span className="w-24 text-right">Total</span>
            <span className="w-6" />
          </div>

          <div className="space-y-2">
            {form.items.map((entry, idx) => {
              const unitPrice = Number(entry.unitPrice) || 0;
              const lineTotal = unitPrice * Number(entry.quantity);
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
                        {i.name} ({i.unit}) — std ₹{i.standardPrice}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center"
                    value={entry.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />

                  {/* Editable unit price — pre-filled from standardPrice */}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-sm text-right"
                    value={entry.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    required
                  />

                  <span className="text-sm text-gray-700 w-24 text-right font-medium">
                    ₹{lineTotal.toLocaleString()}
                  </span>

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

          <div className="mt-2 text-right">
            <span className="text-sm text-gray-500">Total: </span>
            <span className="text-lg font-bold text-gray-900">₹{previewTotal.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            placeholder="Delivery address..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes or special requirements..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium text-white ${
              budgetOver ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {loading ? 'Creating...' : budgetOver ? 'Create Anyway (Over Budget)' : 'Create PO'}
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