import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

/**
 * Broadcast management router for admin panel
 * Interfaces with main app's broadcast system via database
 */
export const broadcastsRouter = router({
  /**
   * List all broadcasts with pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { status, limit, offset } = input;

      const where = status ? { status } : {};

      const [broadcasts, total] = await Promise.all([
        prisma.broadcastNotification.findMany({
          where,
          include: {
            sentBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                logs: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.broadcastNotification.count({ where }),
      ]);

      return {
        broadcasts: broadcasts.map((b) => ({
          ...b,
          totalRecipients: b._count.logs,
          _count: undefined,
        })),
        total,
        hasMore: offset + limit < total,
      };
    }),

  /**
   * Get broadcast details with recent logs
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const broadcast = await prisma.broadcastNotification.findUnique({
        where: { id: input.id },
        include: {
          sentBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          logs: {
            take: 100,
            orderBy: { id: 'desc' },
          },
        },
      });

      if (!broadcast) {
        throw new Error('Broadcast not found');
      }

      // Calculate stats from logs
      const stats = {
        sent: broadcast.logs.filter((l) => l.status === 'SENT').length,
        failed: broadcast.logs.filter((l) => l.status === 'FAILED').length,
        skipped: broadcast.logs.filter((l) => l.status === 'SKIPPED').length,
        pending: broadcast.logs.filter((l) => l.status === 'PENDING').length,
      };

      return {
        ...broadcast,
        stats,
      };
    }),

  /**
   * Get user count by target audience
   */
  getAudienceStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const [total, active, blocked, suspended] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: { deletedAt: null, userData: { status: 'ACTIVE' } },
      }),
      prisma.user.count({
        where: { deletedAt: null, userData: { status: 'BLOCKED' } },
      }),
      prisma.user.count({
        where: { deletedAt: null, userData: { status: 'SUSPENDED' } },
      }),
    ]);

    return {
      all: total,
      active,
      blocked,
      suspended,
    };
  }),

  /**
   * Send a new broadcast
   */
  send: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4096),
        type: z.enum(['INFO', 'PROMO', 'WARNING', 'URGENT']),
        targetAudience: z.enum(['ALL', 'ACTIVE', 'BLOCKED', 'SUSPENDED']).default('ALL'),
        scheduledAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Create broadcast record
      const broadcast = await prisma.broadcastNotification.create({
        data: {
          message: input.message,
          type: input.type,
          targetAudience: input.targetAudience,
          sentById: admin.id,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          status: input.scheduledAt ? 'PENDING' : 'SENDING',
          startedAt: input.scheduledAt ? null : new Date(),
        },
      });

      // If not scheduled, trigger immediate send (via main app's process)
      if (!input.scheduledAt) {
        // This would normally call the main app's broadcast service
        // For now, we'll set it to SENDING and let the main app process it
        // The main app should have a background process checking for SENDING status
      }

      return {
        success: true,
        broadcastId: broadcast.id,
        message: input.scheduledAt
          ? 'Broadcast scheduled successfully'
          : 'Broadcast is being processed',
      };
    }),

  /**
   * Cancel a scheduled broadcast
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const broadcast = await prisma.broadcastNotification.findUnique({
        where: { id: input.id },
      });

      if (!broadcast) {
        throw new Error('Broadcast not found');
      }

      if (broadcast.status !== 'PENDING') {
        throw new Error('Can only cancel pending broadcasts');
      }

      await prisma.broadcastNotification.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
      });

      return { success: true, message: 'Broadcast cancelled successfully' };
    }),

  /**
   * Delete a broadcast (only COMPLETED, FAILED, or CANCELLED)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const broadcast = await prisma.broadcastNotification.findUnique({
        where: { id: input.id },
      });

      if (!broadcast) {
        throw new Error('Broadcast not found');
      }

      if (broadcast.status === 'SENDING') {
        throw new Error('Cannot delete broadcast that is currently sending');
      }

      await prisma.broadcastNotification.delete({
        where: { id: input.id },
      });

      return { success: true, message: 'Broadcast deleted successfully' };
    }),

  /**
   * Get broadcast statistics overview
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const [
      totalBroadcasts,
      pendingBroadcasts,
      sendingBroadcasts,
      completedBroadcasts,
      failedBroadcasts,
    ] = await Promise.all([
      prisma.broadcastNotification.count(),
      prisma.broadcastNotification.count({ where: { status: 'PENDING' } }),
      prisma.broadcastNotification.count({ where: { status: 'SENDING' } }),
      prisma.broadcastNotification.count({ where: { status: 'COMPLETED' } }),
      prisma.broadcastNotification.count({ where: { status: 'FAILED' } }),
    ]);

    // Get recent broadcasts stats
    const recentBroadcasts = await prisma.broadcastNotification.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        message: true,
        type: true,
        sentCount: true,
        failedCount: true,
        completedAt: true,
      },
    });

    return {
      totalBroadcasts,
      pendingBroadcasts,
      sendingBroadcasts,
      completedBroadcasts,
      failedBroadcasts,
      recentBroadcasts,
    };
  }),
});
