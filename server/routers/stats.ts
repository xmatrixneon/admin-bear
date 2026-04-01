import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

/**
 * Dashboard Stats Router
 * Provides read-only statistics for the admin dashboard
 */
export const statsRouter = router({
  /**
   * Get comprehensive dashboard statistics
   * Returns user counts, service counts, revenue metrics, active numbers, etc.
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const [
      totalUsers,
      totalServices,
      totalServers,
      activeNumbersPending,
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

    // Active Numbers breakdown
    const [
      completedNumbers,
      cancelledNumbers,
      totalActiveNumbers,
      pendingRevenueHeld,
    ] = await Promise.all([
      prisma.activeNumber.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { price: true },
        _count: true,
      }),
      prisma.activeNumber.count({ where: { status: 'CANCELLED' } }),
      prisma.activeNumber.count(),
      prisma.activeNumber.aggregate({
        where: { status: 'PENDING', balanceDeducted: true },
        _sum: { price: true },
      }),
    ]);

    // Total Recharge: Separate UPI (DEPOSIT) and PROMO transactions
    const [depositStats, promoStats, referralStats, purchaseStats] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', type: 'DEPOSIT' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', type: 'PROMO' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', type: 'REFERRAL' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', type: 'PURCHASE' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalUsers,
      totalServices,
      totalServers,
      totalWalletBalance: Number(totalWalletBalance._sum.balance || 0),
      activePromocodes,
      // Active Numbers breakdown
      activeNumbersPending: activeNumbersPending,
      activeNumbersCompleted: completedNumbers._count,
      activeNumbersCancelled: cancelledNumbers,
      activeNumbersTotal: totalActiveNumbers,
      pendingRevenueHeld: Number(pendingRevenueHeld._sum.price || 0),
      // Revenue metrics
      totalRevenue: Number(completedNumbers._sum.price || 0),
      otpRevenue: Number(completedNumbers._sum.price || 0),
      otpSold: completedNumbers._count,
      // Recharge metrics - broken down by type
      totalRecharge: Number(depositStats._sum.amount || 0) + Number(promoStats._sum.amount || 0) + Number(referralStats._sum.amount || 0),
      totalRechargeTransactions: (depositStats._count || 0) + (promoStats._count || 0) + (referralStats._count || 0),
      // Separate breakdown
      totalDeposits: Number(depositStats._sum.amount || 0),
      depositCount: depositStats._count || 0,
      totalPromo: Number(promoStats._sum.amount || 0),
      promoCount: promoStats._count || 0,
      totalReferral: Number(referralStats._sum.amount || 0),
      referralCount: referralStats._count || 0,
      // Total spent by users (only completed orders with SMS - NOT cancelled!)
      totalSpent: Number(completedNumbers._sum.price || 0),
      totalCompletedCount: completedNumbers._count || 0,
    };
  }),

  /**
   * Get transaction statistics grouped by type
   * Only counts DEPOSIT and PROMO transactions (recharge transactions)
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

      const dateFilter: any = {
        type: { in: ['DEPOSIT', 'PROMO'] },
      };
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
   * - Uses IST timezone (UTC+5:30) for day boundary (resets at 12:00 AM)
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

      // Helper: convert UTC date to IST date string
      const toISTDateString = (date: Date): string => {
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istDate = new Date(date.getTime() + istOffset);
        return istDate.toISOString().split('T')[0];
      };

      // Get start date (N days ago in IST)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      istNow.setHours(0, 0, 0, 0);
      const startDate = new Date(istNow.getTime() - (days - 1) * 24 * 60 * 60 * 1000 - istOffset);

      // Generate date labels for the last N days in IST
      const dateMap: Record<string, { recharge: number; spent: number; smsCount: number; date: string; fullDate: string }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(istNow.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = toISTDateString(date);
        const label = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
        const fullLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
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

      // Aggregate recharge by IST date
      for (const txn of rechargeTransactions) {
        const dateStr = toISTDateString(txn.createdAt);
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

      // Aggregate spent (SMS received) by IST date
      for (const sms of smsReceived) {
        const dateStr = toISTDateString(sms.createdAt);
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

  /**
   * Get top selling services
   * Returns services ranked by number of completed purchases (SMS received)
   */
  getTopSellingServices: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(5).max(50).default(10),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const limit = input?.limit || 10;

      const topServices = await prisma.service.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          iconUrl: true,
          basePrice: true,
          _count: {
            select: {
              purchases: {
                where: {
                  status: 'COMPLETED',
                },
              },
            },
          },
        },
        orderBy: {
          purchases: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return topServices.map((service) => ({
        id: service.id,
        code: service.code,
        name: service.name,
        iconUrl: service.iconUrl,
        basePrice: Number(service.basePrice),
        soldCount: service._count.purchases,
      }));
    }),
});
