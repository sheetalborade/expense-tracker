const db = require('../config/database');

const getAll = async (userId) => {
  const result = await db.query(
    `SELECT b.*, c.name as category_name, c.icon as category_icon,
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
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );

  return result.rows.map((r) => {
    const spent = parseFloat(r.spent);
    const amount = parseFloat(r.amount);
    const remaining = amount - spent;
    const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
    return {
      ...r,
      amount,
      spent,
      remaining,
      percentage,
      status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok',
    };
  });
};

const create = async (userId, data) => {
  if (data.category_id) {
    const cat = await db.query('SELECT id FROM categories WHERE id = $1 AND user_id = $2', [
      data.category_id,
      userId,
    ]);
    if (cat.rows.length === 0) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
  }

  const result = await db.query(
    `INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      userId,
      data.category_id || null,
      data.amount,
      data.period || 'monthly',
      data.start_date,
      data.end_date || null,
    ]
  );
  return result.rows[0];
};

const update = async (userId, id, data) => {
  const existing = await db.query('SELECT id FROM budgets WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  if (existing.rows.length === 0) {
    const err = new Error('Budget not found');
    err.statusCode = 404;
    throw err;
  }

  const fields = [];
  const values = [];
  let idx = 1;
  if (data.amount !== undefined) {
    fields.push(`amount = $${idx++}`);
    values.push(data.amount);
  }
  if (data.period) {
    fields.push(`period = $${idx++}`);
    values.push(data.period);
  }
  if (data.start_date) {
    fields.push(`start_date = $${idx++}`);
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push(`end_date = $${idx++}`);
    values.push(data.end_date);
  }
  if (data.category_id !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(data.category_id);
  }

  if (fields.length === 0) {
    const r = await db.query('SELECT * FROM budgets WHERE id = $1', [id]);
    return r.rows[0];
  }

  values.push(id, userId);
  const result = await db.query(
    `UPDATE budgets SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
};

const remove = async (userId, id) => {
  const result = await db.query(
    'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Budget not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

module.exports = { getAll, create, update, remove };
