import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Pencil, Trash2, Plus, Download, FileText } from 'lucide-react';
import Navbar from '../layouts/Navbar';
import api from '../api/axios';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', type: '', categoryId: '', page: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      params.set('page', filters.page);
      params.set('limit', 10);
      params.set('sortBy', 'transaction_date');
      params.set('order', 'desc');

      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.data.transactions);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);

      const token = localStorage.getItem('token');
      const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
      const url = `${baseURL}/transactions/export/csv?${params}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(err.message || 'Failed to export CSV');
    }
  };

  const handleExportPdf = async () => {
    try {
      // Fetch all matching transactions (same filters as CSV)
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      params.set('limit', 1000);
      params.set('page', 1);

      const res = await api.get(`/transactions?${params}`);
      const rows = res.data.data.transactions || [];

      const formatAmt = (n) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(n);

      const tableRows = rows
        .map(
          (t) => `
        <tr>
          <td>${new Date(t.transaction_date).toLocaleDateString('en-GB')}</td>
          <td>${t.description || ''}</td>
          <td>${t.category_name || ''}</td>
          <td>${t.type}</td>
          <td style="text-align:right">${t.type === 'income' ? '+' : '-'}${formatAmt(t.amount)}</td>
        </tr>`
        )
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transactions Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { color: #dc2626; margin-bottom: 4px; }
            p { color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #fef2f2; color: #991b1b; }
            tr:nth-child(even) { background: #fafafa; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Expense Tracker — Transactions</h1>
          <p>Generated on ${new Date().toLocaleString()} · ${rows.length} records</p>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>${tableRows || '<tr><td colspan="5">No transactions</td></tr>'}</tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>`;

      const win = window.open('', '_blank');
      if (!win) {
        alert('Please allow pop-ups to export PDF');
        return;
      }
      win.document.write(html);
      win.document.close();
    } catch (err) {
      alert(err.message || 'Failed to export PDF');
    }
  };

  return (
    <div>
      <Navbar title="Transactions" subtitle="View, search and manage your transactions" />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <Link
            to="/transactions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Amount</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 dark:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">
                      {new Date(t.transaction_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{t.category_icon}</span>
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">{t.category_name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.type === 'income'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {t.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatINR(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/transactions/${t.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-primary-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:bg-gray-800"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
