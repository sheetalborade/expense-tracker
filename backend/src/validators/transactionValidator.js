const { z } = require('zod');

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  category_id: z.number().int().positive(),
  description: z.string().min(1).max(255),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  payment_method: z.string().max(50).optional().default('Cash'),
  notes: z.string().max(500).optional().nullable(),
});

const updateTransactionSchema = transactionSchema.partial();

module.exports = { transactionSchema, updateTransactionSchema };
