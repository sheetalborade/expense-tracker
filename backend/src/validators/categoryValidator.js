const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense']),
  icon: z.string().max(50).optional().default('📁'),
  color: z.string().max(20).optional().default('#ef4444'),
});

module.exports = { categorySchema };
