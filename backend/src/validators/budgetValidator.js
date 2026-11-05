const { z } = require('zod');

const budgetSchema = z.object({
  category_id: z.number().int().positive().nullable().optional(),
  amount: z.number().positive(),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

module.exports = { budgetSchema };
