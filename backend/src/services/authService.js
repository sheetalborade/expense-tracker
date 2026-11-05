const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

const register = async ({ name, email, password }) => {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email.toLowerCase(), hash]
  );

  const user = result.rows[0];

  // Create default categories for the user
  const defaultCategories = [
    { name: 'Food', type: 'expense', icon: '🍔', color: '#ef4444' },
    { name: 'Transport', type: 'expense', icon: '🚌', color: '#f97316' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
    { name: 'Bills', type: 'expense', icon: '⚡', color: '#eab308' },
    { name: 'Entertainment', type: 'expense', icon: '🎮', color: '#8b5cf6' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#3b82f6' },
    { name: 'Health', type: 'expense', icon: '❤️', color: '#ef4444' },
    { name: 'Others', type: 'expense', icon: '📁', color: '#6b7280' },
    { name: 'Salary', type: 'income', icon: '💰', color: '#22c55e' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#14b8a6' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#06b6d4' },
    { name: 'Other Income', type: 'income', icon: '💵', color: '#84cc16' },
  ];

  for (const cat of defaultCategories) {
    await db.query(
      `INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5)`,
      [user.id, cat.name, cat.type, cat.icon, cat.color]
    );
  }

  // Default settings
  await db.query(
    `INSERT INTO user_settings (user_id, currency, theme) VALUES ($1, 'INR', 'light')`,
    [user.id]
  );

  // Email verification token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await db.query(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, verifyToken, verifyExpires]
  );

  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}`;

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return {
    user: { ...user, email_verified: false },
    token,
    ...(process.env.NODE_ENV !== 'production' && {
      verificationToken: verifyToken,
      verificationLink: verifyLink,
    }),
  };
};

const login = async ({ email, password }) => {
  const result = await db.query(
    'SELECT id, name, email, password_hash, email_verified FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      email_verified: user.email_verified,
    },
    token,
  };
};

const getProfile = async (userId) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.email_verified, u.created_at,
            s.currency, s.theme, s.notifications_enabled
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

const updateProfile = async (userId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.name) {
    fields.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.email) {
    fields.push(`email = $${idx++}`);
    values.push(data.email.toLowerCase());
  }

  if (fields.length === 0) return getProfile(userId);

  values.push(userId);
  const result = await db.query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, name, email`,
    values
  );
  return result.rows[0];
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!valid) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    throw err;
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
  return true;
};

const forgotPassword = async (email) => {
  const result = await db.query('SELECT id, name, email FROM users WHERE email = $1', [
    email.toLowerCase(),
  ]);

  // Always return success message to prevent email enumeration
  if (result.rows.length === 0) {
    return { message: 'If that email exists, a reset link has been generated.' };
  }

  const user = result.rows[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate previous tokens
  await db.query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
    [user.id]
  );

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, token, expiresAt]
  );

  // In production you would send an email here.
  // For local/portfolio use we return the token so you can test the flow.
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  return {
    message: 'If that email exists, a reset link has been generated.',
    // Only returned in development so you can test without email
    ...(process.env.NODE_ENV !== 'production' && {
      resetToken: token,
      resetLink,
    }),
  };
};

const resetPassword = async (token, newPassword) => {
  const result = await db.query(
    `SELECT prt.*, u.id as uid
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    throw err;
  }

  const row = result.rows[0];
  const hash = await bcrypt.hash(newPassword, 12);

  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
    hash,
    row.uid,
  ]);

  await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [row.id]);

  return true;
};

const verifyEmail = async (token) => {
  const result = await db.query(
    `SELECT evt.*, u.id as uid
     FROM email_verification_tokens evt
     JOIN users u ON u.id = evt.user_id
     WHERE evt.token = $1 AND evt.used = FALSE AND evt.expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid or expired verification token');
    err.statusCode = 400;
    throw err;
  }

  const row = result.rows[0];
  await db.query(
    `UPDATE users SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [row.uid]
  );
  await db.query(`UPDATE email_verification_tokens SET used = TRUE WHERE id = $1`, [row.id]);

  return true;
};

const resendVerification = async (userId) => {
  const userResult = await db.query(
    'SELECT id, email, email_verified FROM users WHERE id = $1',
    [userId]
  );
  if (userResult.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const user = userResult.rows[0];
  if (user.email_verified) {
    return { message: 'Email is already verified', alreadyVerified: true };
  }

  await db.query(
    'UPDATE email_verification_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
    [userId]
  );

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, verifyToken, verifyExpires]
  );

  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}`;

  return {
    message: 'Verification link generated',
    ...(process.env.NODE_ENV !== 'production' && {
      verificationToken: verifyToken,
      verificationLink: verifyLink,
    }),
  };
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
