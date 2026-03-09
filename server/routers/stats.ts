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

  /**
   * Get recharge and spent chart data for the last N days
   * - Recharge = UPI (DEPOSIT) + PROMO transactions
   * - Spent = ActiveNumber COMPLETED (SMS received = successful purchases)
   */
  getRechargeSpentChart: protectedProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(30).default(7),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const days = input?.days || 7;

      // Get start date (N days ago)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Generate date labels for the last N days
      const dateMap: Record<string, { recharge: number; spent: number; smsCount: number; date: string; fullDate: string }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-US', { weekday: 'short' });
        const fullLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap[dateStr] = { recharge: 0, spent: 0, smsCount: 0, date: label, fullDate: fullLabel };
      }

      // Fetch recharge transactions (DEPOSIT = UPI, PROMO)
      const rechargeTransactions = await prisma.transaction.findMany({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
          type: { in: ['DEPOSIT', 'PROMO'] },
        },
        select: {
          type: true,
          amount: true,
          createdAt: true,
        },
      });

      // Aggregate recharge by date
      for (const txn of rechargeTransactions) {
        const dateStr = txn.createdAt.toISOString().split('T')[0];
        if (dateMap[dateStr]) {
          dateMap[dateStr].recharge += Number(txn.amount);
        }
      }

      // Fetch spent = SMS received (ActiveNumber COMPLETED)
      const smsReceived = await prisma.activeNumber.findMany({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
        select: {
          price: true,
          createdAt: true,
        },
      });

      // Aggregate spent (SMS received) by date
      for (const sms of smsReceived) {
        const dateStr = sms.createdAt.toISOString().split('T')[0];
        if (dateMap[dateStr]) {
          dateMap[dateStr].spent += Number(sms.price || 0);
          dateMap[dateStr].smsCount += 1;
        }
      }

      // Convert to array
      const chartData = Object.entries(dateMap).map(([key, value]) => ({
        date: value.date,
        fullDate: value.fullDate,
        recharge: value.recharge,
        spent: value.spent,
        smsCount: value.smsCount,
      }));

      // Calculate totals
      const totals = {
        totalRecharge: chartData.reduce((sum, d) => sum + d.recharge, 0),
        totalSpent: chartData.reduce((sum, d) => sum + d.spent, 0),
        totalSms: chartData.reduce((sum, d) => sum + d.smsCount, 0),
      };

      return {
        chartData,
        totals,
      };
    }),
});
