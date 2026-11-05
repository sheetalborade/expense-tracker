import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Navbar from '../layouts/Navbar';
import api from '../api/axios';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const pieColors = ['#ef4444', '#f97316', '#ec4899', '#eab308', '#8b5cf6', '#6b7280', '#3b82f6'];

export default function Reports() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const [trends, setTrends] = useState([]);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/dashboard/monthly-trends?year=${year}`),
      api.get(`/dashboard/category-expenses?year=${year}&month=${month}`),
    ])
      .then(([t, c]) => {
        setTrends(t.data.data);
        setCategoryData(c.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar title="Reports" subtitle="Analyze your income and expenses" />
        <div className="p-6 flex justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Reports" subtitle="Analyze your income and expenses" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Income vs Expense</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatINR(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Expense by Category</h3>
            {categoryData && categoryData.categories.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-52 h-52 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.categories}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {categoryData.categories.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Total</span>
                    <span className="text-sm font-bold">{formatINR(categoryData.total)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryData.categories.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: pieColors[i % pieColors.length] }}
                        />
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">{c.name}</span>
                      </div>
                      <span className="font-medium">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-center py-16">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
