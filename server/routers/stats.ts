import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

/**
 * Dashboard Stats Router
 * Provides read-only statistics for the admin dashboard
 */
export const statsRouter = router({
  /**
   * Get comprehensive dashboard statistics
   * Returns user counts, service counts, revenue metrics, etc.
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const [
      totalUsers,
      totalServices,
      totalServers,
      activeNumbers,
      totalWalletBalance,
      activePromocodes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.otpServer.count({ where: { isActive: true } }),
      prisma.activeNumber.count({ where: { status: 'PENDING' } }),
      prisma.wallet.aggregate({
        _sum: { balance: true },
      }),
      prisma.promocode.count({ where: { isActive: true } }),
    ]);

    // Total Revenue: Only count SMS received (COMPLETED ActiveNumber)
    const totalRevenue = await prisma.activeNumber.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { price: true },
    });

    // Total Recharge: Only count DEPOSIT and PROMO transactions
    const totalRecharge = await prisma.transaction.aggregate({
      where: {
        status: 'COMPLETED',
        type: { in: ['DEPOSIT', 'PROMO'] },
      },
      _sum: { amount: true },
    });

    return {
      totalUsers,
      totalServices,
      totalServers,
      activeNumbers,
      totalWalletBalance: Number(totalWalletBalance._sum.balance || 0),
      activePromocodes,
      totalRevenue: Number(totalRevenue._sum.price || 0),
      otpRevenue: Number(totalRevenue._sum.price || 0),
      totalRecharge: Number(totalRecharge._sum.amount || 0),
    };
  }),

  /**
   * Get transaction statistics grouped by type
   * Optional date range filtering
   */
  getTransactionStats: protectedProcedure
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
