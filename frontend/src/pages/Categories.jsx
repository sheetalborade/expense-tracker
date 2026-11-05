import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import Navbar from '../layouts/Navbar';
import api from '../api/axios';

export default function Categories() {
  const [tab, setTab] = useState('expense');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📁', color: '#ef4444' });
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/categories/with-counts?type=${tab}`);
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', icon: '📁', color: '#ef4444' });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, icon: c.icon, color: c.color });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, form);
      } else {
        await api.post('/categories', { ...form, type: tab });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <Navbar title="Categories" subtitle="Manage your income and expense categories" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setTab('expense')}
              className={`px-5 py-2 text-sm font-semibold ${
                tab === 'expense' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 dark:text-gray-400 dark:text-gray-500'
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setTab('income')}
              className={`px-5 py-2 text-sm font-semibold ${
                tab === 'income' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 dark:text-gray-400 dark:text-gray-500'
              }`}
            >
              Income Categories
            </button>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: c.color + '20' }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {c.transaction_count} transaction{c.transaction_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 dark:text-gray-500 hover:text-primary-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editId ? 'Edit' : 'Add'} Category</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-10 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
