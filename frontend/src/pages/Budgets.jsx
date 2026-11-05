import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../layouts/Navbar';
import api from '../api/axios';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    amount: '',
    category_id: '',
    period: 'monthly',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    api
      .get('/categories?type=expense')
      .then((res) => setCategories(res.data.data || []))
      .catch(console.error);
  }, []);

  const openAdd = () => {
    setEditId(null);
    setError('');
    setForm({
      amount: '',
      category_id: '',
      period: 'monthly',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
    });
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditId(b.id);
    setError('');
    setForm({
      amount: b.amount,
      category_id: b.category_id || '',
      period: b.period || 'monthly',
      start_date: b.start_date?.slice(0, 10) || '',
      end_date: b.end_date?.slice(0, 10) || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id, 10) : null,
        period: form.period,
        start_date: form.start_date,
        end_date: form.end_date || null,
      };

      if (editId) {
        await api.put(`/budgets/${editId}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      setShowModal(false);
      fetchBudgets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'exceeded') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
          <XCircle className="w-3.5 h-3.5" /> Exceeded
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5" /> Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
        <CheckCircle className="w-3.5 h-3.5" /> On Track
      </span>
    );
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-primary-600';
  };

  return (
    <div>
      <Navbar title="Budgets" subtitle="Set and track your spending limits" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Track how much you have spent against your planned budget.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
            <p className="text-gray-400 dark:text-gray-500 mb-4">No budgets set yet</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg"
            >
              <Plus className="w-4 h-4" /> Create your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {b.category_name
                        ? `${b.category_icon || ''} ${b.category_name}`
                        : 'Overall Budget'}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                      {b.period} · Starts {b.start_date?.slice(0, 10)}
                    </p>
                  </div>
                  {getStatusBadge(b.status)}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      Spent: <span className="font-medium text-gray-900 dark:text-white">{formatINR(b.spent)}</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      of <span className="font-medium text-gray-900 dark:text-white">{formatINR(b.amount)}</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(b.percentage)}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className="text-gray-400 dark:text-gray-500">{b.percentage}% used</span>
                    <span
                      className={
                        b.remaining < 0 ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'
                      }
                    >
                      {b.remaining >= 0
                        ? `${formatINR(b.remaining)} left`
                        : `${formatINR(Math.abs(b.remaining))} over`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openEdit(b)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-500"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-sm border border-red-100 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">
              {editId ? 'Edit Budget' : 'Add Budget'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Budget Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category (optional)</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Overall Budget (All expenses)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Leave empty to track all expenses together
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Period</label>
                  <select
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:bg-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                >
                  {editId ? 'Update' : 'Create'} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
