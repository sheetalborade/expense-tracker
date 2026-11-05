import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  List,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Navbar from '../layouts/Navbar';
import api from '../api/axios';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, c, t] = await Promise.all([
          api.get(`/dashboard/summary?year=${year}&month=${month}`),
          api.get(`/dashboard/category-expenses?year=${year}&month=${month}`),
          api.get(`/dashboard/monthly-trends?year=${year}`),
        ]);
        setSummary(s.data.data);
        setCategoryData(c.data.data);
        setTrends(t.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year, month]);

  const cards = summary
    ? [
        {
          title: 'Total Balance',
          value: formatINR(summary.totalBalance),
          change: summary.balanceChange,
          icon: Wallet,
          color: 'bg-primary-50 text-primary-600',
        },
        {
          title: 'Total Income',
          value: formatINR(summary.totalIncome),
          change: summary.incomeChange,
          icon: TrendingUp,
          color: 'bg-green-50 text-green-600',
        },
        {
          title: 'Total Expenses',
          value: formatINR(summary.totalExpenses),
          change: summary.expenseChange,
          icon: TrendingDown,
          color: 'bg-red-50 text-red-600',
        },
        {
          title: 'Transactions',
          value: summary.transactionCount,
          change: summary.transactionChange,
          icon: List,
          color: 'bg-blue-50 text-blue-600',
        },
      ]
    : [];

  const pieColors = ['#ef4444', '#f97316', '#ec4899', '#eab308', '#8b5cf6', '#6b7280', '#3b82f6'];

  if (loading) {
    return (
      <div>
        <Navbar title="Dashboard" subtitle="Here's your financial summary" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Dashboard" subtitle="Here's your financial summary" />
      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.title} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm">
                {card.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={card.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(card.change)}%
                </span>
                <span className="text-gray-400 dark:text-gray-500">vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense by Category */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Expense by Category</h3>
            {categoryData && categoryData.categories.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-48 h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.categories}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
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
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatINR(categoryData.total)}
                    </span>
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
                      <span className="font-medium text-gray-900 dark:text-white">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">No expense data yet</p>
            )}
          </div>

          {/* Monthly Overview */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Overview</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatINR(v)} />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick action */}
        <div className="flex gap-3">
          <Link
            to="/transactions/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
          >
            + Add Transaction
          </Link>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:bg-gray-800 text-gray-700 font-medium rounded-lg transition"
          >
            View All Transactions
          </Link>
        </div>
      </div>
    </div>
  );
}
