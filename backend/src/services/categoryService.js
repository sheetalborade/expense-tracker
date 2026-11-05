const db = require('../config/database');

const getAll = async (userId, type) => {
  let query = 'SELECT * FROM categories WHERE user_id = $1';
  const params = [userId];
  if (type) {
    query += ' AND type = $2';
    params.push(type);
  }
  query += ' ORDER BY name ASC';
  const result = await db.query(query, params);
  return result.rows;
};

const create = async (userId, data) => {
  const result = await db.query(
    `INSERT INTO categories (user_id, name, type, icon, color)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, data.name, data.type, data.icon || '📁', data.color || '#ef4444']
  );
  return result.rows[0];
};

const update = async (userId, id, data) => {
  const existing = await db.query('SELECT id FROM categories WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  if (existing.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }

  const fields = [];
  const values = [];
  let idx = 1;
  if (data.name) {
    fields.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.icon) {
    fields.push(`icon = $${idx++}`);
    values.push(data.icon);
  }
  if (data.color) {
    fields.push(`color = $${idx++}`);
    values.push(data.color);
  }
  if (fields.length === 0) {
    const r = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return r.rows[0];
  }
  values.push(id, userId);
  const result = await db.query(
    `UPDATE categories SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
};

const remove = async (userId, id) => {
  // Check if used
  const used = await db.query(
    'SELECT id FROM transactions WHERE category_id = $1 AND user_id = $2 LIMIT 1',
    [id, userId]
  );
  if (used.rows.length > 0) {
    const err = new Error('Cannot delete category that has transactions. Archive it instead.');
    err.statusCode = 400;
    throw err;
  }

  const result = await db.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

const getWithCounts = async (userId, type = 'expense') => {
  const result = await db.query(
    `SELECT c.*, COUNT(t.id)::int as transaction_count
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
     WHERE c.user_id = $1 AND c.type = $2
     GROUP BY c.id
     ORDER BY c.name`,
    [userId, type]
  );
  return result.rows;
};

module.exports = { getAll, create, update, remove, getWithCounts };
