import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../layouts/Navbar';
import api from '../api/axios';

export default function AddTransaction() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/categories?type=${type}`)
      .then((res) => {
        setCategories(res.data.data);
        if (!isEdit) setCategoryId('');
      })
      .catch(console.error);
  }, [type]);

  useEffect(() => {
    if (isEdit) {
      api
        .get(`/transactions/${id}`)
        .then((res) => {
          const t = res.data.data;
          setType(t.type);
          setAmount(t.amount);
          setDescription(t.description);
          setCategoryId(String(t.category_id));
          setDate(t.transaction_date.slice(0, 10));
          setPaymentMethod(t.payment_method || 'Cash');
        })
        .catch(() => navigate('/transactions'));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        description,
        category_id: parseInt(categoryId, 10),
        transaction_date: date,
        payment_method: paymentMethod,
      };
      if (isEdit) {
        await api.put(`/transactions/${id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
        subtitle="Add your income or expense details"
      />
      <div className="p-6 max-w-2xl">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          {/* Type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${
                type === 'expense'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-800'
              }`}
            >
              ↓ Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${
                type === 'income'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-800'
              }`}
            >
              ↑ Income
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                required
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Transaction' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
