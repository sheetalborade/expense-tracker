const db = require('../config/database');

const getSummary = async (userId, year, month) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);

  // Previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEndDate = new Date(prevYear, prevMonth, 0);
  const prevEnd = prevEndDate.toISOString().slice(0, 10);

  const current = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
       COUNT(*)::int as transaction_count
     FROM transactions
     WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3`,
    [userId, start, end]
  );

  const previous = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
       COUNT(*)::int as transaction_count
     FROM transactions
     WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3`,
    [userId, prevStart, prevEnd]
  );

  const cur = current.rows[0];
  const prev = previous.rows[0];

  const balance = parseFloat(cur.total_income) - parseFloat(cur.total_expenses);
  const prevBalance = parseFloat(prev.total_income) - parseFloat(prev.total_expenses);

  const pct = (curr, prevVal) => {
    if (parseFloat(prevVal) === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prevVal) / Math.abs(prevVal)) * 100);
  };

  return {
    totalBalance: balance,
    totalIncome: parseFloat(cur.total_income),
    totalExpenses: parseFloat(cur.total_expenses),
    transactionCount: cur.transaction_count,
    balanceChange: pct(balance, prevBalance),
    incomeChange: pct(parseFloat(cur.total_income), parseFloat(prev.total_income)),
    expenseChange: pct(parseFloat(cur.total_expenses), parseFloat(prev.total_expenses)),
    transactionChange: pct(cur.transaction_count, prev.transaction_count),
  };
};

const getCategoryExpenses = async (userId, year, month) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);

  const result = await db.query(
    `SELECT c.name, c.icon, c.color,
            COALESCE(SUM(t.amount), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
       AND t.type = 'expense'
       AND t.transaction_date BETWEEN $2 AND $3
     WHERE c.user_id = $1 AND c.type = 'expense'
     GROUP BY c.id
     HAVING COALESCE(SUM(t.amount), 0) > 0
     ORDER BY total DESC`,
    [userId, start, end]
  );

  const total = result.rows.reduce((sum, r) => sum + parseFloat(r.total), 0);

  return {
    total,
    categories: result.rows.map((r) => ({
      name: r.name,
      icon: r.icon,
      color: r.color,
      amount: parseFloat(r.total),
      percentage: total > 0 ? Math.round((parseFloat(r.total) / total) * 100) : 0,
    })),
  };
};

const getMonthlyTrends = async (userId, year) => {
  const result = await db.query(
    `SELECT
       EXTRACT(MONTH FROM transaction_date)::int as month,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE user_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2
     GROUP BY EXTRACT(MONTH FROM transaction_date)
     ORDER BY month`,
    [userId, year]
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = months.map((name, i) => {
    const found = result.rows.find((r) => r.month === i + 1);
    return {
      month: name,
      income: found ? parseFloat(found.income) : 0,
      expense: found ? parseFloat(found.expense) : 0,
    };
  });

  return data;
};

const getRecentTransactions = async (userId, limit = 5) => {
  const result = await db.query(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

module.exports = { getSummary, getCategoryExpenses, getMonthlyTrends, getRecentTransactions };
