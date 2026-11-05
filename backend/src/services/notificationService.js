const db = require('../config/database');

const create = async (userId, title, message) => {
  const result = await db.query(
    `INSERT INTO notifications (user_id, title, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, title, message]
  );
  return result.rows[0];
};

const getAll = async (userId, { limit = 20 } = {}) => {
  const result = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

const getUnreadCount = async (userId) => {
  const result = await db.query(
    `SELECT COUNT(*)::int as count FROM notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rows[0].count;
};

const markAsRead = async (userId, id) => {
  const result = await db.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

const markAllAsRead = async (userId) => {
  await db.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return true;
};

/** Check budgets and create notifications when thresholds are crossed */
const checkBudgetAlerts = async (userId) => {
  const budgets = await db.query(
    `SELECT b.*, c.name as category_name,
       COALESCE(
         (SELECT SUM(t.amount) FROM transactions t
          WHERE t.user_id = b.user_id
            AND t.type = 'expense'
            AND (b.category_id IS NULL OR t.category_id = b.category_id)
            AND t.transaction_date >= b.start_date
            AND (b.end_date IS NULL OR t.transaction_date <= b.end_date)
         ), 0
       ) as spent
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.user_id = $1`,
    [userId]
  );

  for (const b of budgets.rows) {
    const spent = parseFloat(b.spent);
    const amount = parseFloat(b.amount);
    if (amount <= 0) continue;
    const percentage = Math.round((spent / amount) * 100);
    const label = b.category_name || 'Overall';

    if (percentage >= 100) {
      // Avoid duplicate recent alerts (same title in last 24h)
      const existing = await db.query(
        `SELECT id FROM notifications
         WHERE user_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [userId, `Budget exceeded: ${label}`]
      );
      if (existing.rows.length === 0) {
        await create(
          userId,
          `Budget exceeded: ${label}`,
          `You have spent ₹${spent.toLocaleString('en-IN')} of your ₹${amount.toLocaleString('en-IN')} ${label} budget (${percentage}%).`
        );
      }
    } else if (percentage >= 80) {
      const existing = await db.query(
        `SELECT id FROM notifications
         WHERE user_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [userId, `Budget warning: ${label}`]
      );
      if (existing.rows.length === 0) {
        await create(
          userId,
          `Budget warning: ${label}`,
          `You have used ${percentage}% of your ${label} budget (₹${spent.toLocaleString('en-IN')} of ₹${amount.toLocaleString('en-IN')}).`
        );
      }
    }
  }
};

module.exports = {
  create,
  getAll,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  checkBudgetAlerts,
};
