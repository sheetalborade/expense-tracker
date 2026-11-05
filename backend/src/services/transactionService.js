const db = require('../config/database');

const create = async (userId, data) => {
  // Verify category belongs to user
  const cat = await db.query('SELECT id FROM categories WHERE id = $1 AND user_id = $2', [
    data.category_id,
    userId,
  ]);
  if (cat.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }

  const result = await db.query(
    `INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      data.category_id,
      data.type,
      data.amount,
      data.description,
      data.transaction_date,
      data.payment_method || 'Cash',
      data.notes || null,
    ]
  );
  return result.rows[0];
};

const getAll = async (userId, filters = {}) => {
  const {
    type,
    categoryId,
    from,
    to,
    search,
    page = 1,
    limit = 10,
    sortBy = 'transaction_date',
    order = 'desc',
  } = filters;

  const allowedSort = ['transaction_date', 'amount', 'created_at'];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'transaction_date';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  let where = ['t.user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (type) {
    where.push(`t.type = $${idx++}`);
    params.push(type);
  }
  if (categoryId) {
    where.push(`t.category_id = $${idx++}`);
    params.push(categoryId);
  }
  if (from) {
    where.push(`t.transaction_date >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    where.push(`t.transaction_date <= $${idx++}`);
    params.push(to);
  }
  if (search) {
    where.push(`(t.description ILIKE $${idx} OR t.notes ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = where.join(' AND ');
  const offset = (page - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await db.query(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE ${whereClause}
     ORDER BY t.${sortColumn} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return {
    transactions: result.rows,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getById = async (userId, id) => {
  const result = await db.query(
    `SELECT t.*, c.name as category_name, c.icon as category_icon
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [id, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

const update = async (userId, id, data) => {
  await getById(userId, id); // ownership check

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

  const fields = [];
  const values = [];
  let idx = 1;

  const map = {
    type: 'type',
    amount: 'amount',
    category_id: 'category_id',
    description: 'description',
    transaction_date: 'transaction_date',
    payment_method: 'payment_method',
    notes: 'notes',
  };

  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return getById(userId, id);

  values.push(id, userId);
  const result = await db.query(
    `UPDATE transactions SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    values
  );
  return result.rows[0];
};

const remove = async (userId, id) => {
  const result = await db.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

const exportAll = async (userId, filters = {}) => {
  const { type, categoryId, from, to, search } = filters;

  let where = ['t.user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (type) {
    where.push(`t.type = $${idx++}`);
    params.push(type);
  }
  if (categoryId) {
    where.push(`t.category_id = $${idx++}`);
    params.push(categoryId);
  }
  if (from) {
    where.push(`t.transaction_date >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    where.push(`t.transaction_date <= $${idx++}`);
    params.push(to);
  }
  if (search) {
    where.push(`(t.description ILIKE $${idx} OR t.notes ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = where.join(' AND ');
  const result = await db.query(
    `SELECT t.transaction_date, t.description, c.name as category_name, t.type,
            t.amount, t.payment_method, t.notes
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE ${whereClause}
     ORDER BY t.transaction_date DESC, t.created_at DESC`,
    params
  );
  return result.rows;
};

module.exports = { create, getAll, getById, update, remove, exportAll };
