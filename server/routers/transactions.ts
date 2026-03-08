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
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: transactionTypeSchema.optional(),
          status: transactionStatusSchema.optional(),
        })
        .merge(paginationSchema)
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const where: any = {};

      // Handle search
      if (input.search && input.search.length >= 2) {
        where.OR = [
          { phoneNumber: { contains: input.search } },
          { txnId: { contains: input.search } },
        ];
      }

      // Handle filters
      if (input.type) where.type = input.type;
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
                    firstName: true,
                    lastName: true,
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
   * Optional date range filtering
   */
  getStats: protectedProcedure
    .input(
      z
        .object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const { startDate, endDate } = input || {};

      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
      }

      const [totalCount, byType] = await Promise.all([
        prisma.transaction.count({ where: dateFilter }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: dateFilter,
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
