import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Pagination schema
 */
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

/**
 * Wallets Router
 * Read-only wallet information with user details
 */
export const walletsRouter = router({
  /**
   * List all wallets with user details
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 50;

      const [wallets, total] = await Promise.all([
        prisma.wallet.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                telegramId: true,
                telegramUsername: true,
                firstName: true,
                lastName: true,
                isAdmin: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.wallet.count(),
      ]);

      return {
        wallets,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  /**
   * Get a single wallet by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const wallet = await prisma.wallet.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              telegramId: true,
              telegramUsername: true,
              firstName: true,
              lastName: true,
              isAdmin: true,
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found',
        });
      }

      return wallet;
    }),

  /**
   * Get wallet statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const [totalBalance, totalSpent, totalOtp, totalRecharge] = await Promise.all([
      prisma.wallet.aggregate({
        _sum: { balance: true },
      }),
      prisma.wallet.aggregate({
        _sum: { totalSpent: true },
      }),
      prisma.wallet.aggregate({
        _sum: { totalOtp: true },
      }),
      prisma.wallet.aggregate({
        _sum: { totalRecharge: true },
      }),
    ]);

    return {
      totalBalance: Number(totalBalance._sum.balance || 0),
      totalSpent: Number(totalSpent._sum.totalSpent || 0),
      totalOtp: totalOtp._sum.totalOtp || 0,
      totalRecharge: Number(totalRecharge._sum.totalRecharge || 0),
    };
  }),
});
