import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

/**
 * Transaction-related schemas
 */
const transactionTypeSchema = z.enum([
  'DEPOSIT',
  'PURCHASE',
  'REFUND',
  'PROMO',
  'REFERRAL',
  'ADJUSTMENT',
]);
const transactionStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED']);
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

/**
 * Transactions Router
 * Read-only transaction history with filtering and pagination
 */
export const transactionsRouter = router({
  /**
   * List transactions with filtering and pagination
   * By default shows only DEPOSIT and PROMO (recharge transactions)
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: transactionTypeSchema.optional(),
          status: transactionStatusSchema.optional(),
          showAll: z.boolean().optional(), // If true, show all types; otherwise only DEPOSIT & PROMO
        })
        .merge(paginationSchema)
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const where: any = {};

      // By default only show DEPOSIT and PROMO (recharge transactions)
      if (!input.showAll && !input.type) {
        where.type = { in: ['DEPOSIT', 'PROMO'] };
      } else if (input.type) {
        where.type = input.type;
      }

      // Handle search (search in UTR/txnId and Telegram ID)
      if (input.search && input.search.length >= 2) {
        where.OR = [
          { txnId: { contains: input.search, mode: 'insensitive' } },
          { wallet: { user: { telegramId: { contains: input.search } } } },
        ];
      }

      // Handle status filter
      if (input.status) where.status = input.status;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            wallet: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    telegramId: true,
                    telegramUsername: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        prisma.transaction.count({ where }),
      ]);

      return {
        transactions,
        pagination: {
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        },
      };
    }),

  /**
   * Get transaction statistics grouped by type
   * By default only counts DEPOSIT and PROMO (recharge transactions)
   */
  getStats: protectedProcedure
    .input(
      z
        .object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          showAll: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const { startDate, endDate, showAll } = input || {};

      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
      }

      // By default only count DEPOSIT and PROMO
      const typeFilter = showAll ? {} : { type: { in: ['DEPOSIT', 'PROMO'] } };
      const where = { ...dateFilter, ...typeFilter };

      const [totalCount, byType] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.groupBy({
          by: ['type'],
          where,
          _count: true,
          _sum: { amount: true },
        }),
      ]);

      const byTypeMap = byType.reduce((acc: any, item) => {
        acc[item.type] = {
          count: item._count,
          amount: Number(item._sum.amount || 0),
        };
        return acc;
      }, {});

      return {
        total: totalCount,
        byType: byTypeMap,
      };
    }),
});
