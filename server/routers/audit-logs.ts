import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Audit log action schema
 */
const auditActionSchema = z.enum([
  'DELETE',
  'UPDATE',
  'BALANCE_ADJUST',
  'SET_ADMIN',
  'REMOVE_ADMIN',
  'STATUS_UPDATE',
  'SOFT_DELETE',
  'CREATE_SERVICE',
  'UPDATE_SERVICE',
  'DELETE_SERVICE',
  'CREATE_SERVER',
  'UPDATE_SERVER',
  'DELETE_SERVER',
  'CREATE_PROMOCODE',
  'UPDATE_PROMOCODE',
  'DELETE_PROMOCODE',
  'UPDATE_SETTINGS',
  'RESET_SETTINGS',
]);

/**
 * Pagination schema
 */
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

/**
 * Audit Logs Router
 * Read-only audit trail with filtering and pagination
 */
export const auditLogsRouter = router({
  /**
   * Get audit logs with filtering and pagination
   */
  list: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
          action: auditActionSchema.optional(),
        })
        .merge(paginationSchema)
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const where: any = {};
      if (input.userId) where.userId = input.userId;
      if (input.action) where.action = input.action;

      const [logs, total] = await Promise.all([
        prisma.userAuditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telegramUsername: true,
              },
            },
            admin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telegramUsername: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        prisma.userAuditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        },
      };
    }),

  /**
   * Get a single audit log by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const log = await prisma.userAuditLog.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              telegramUsername: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              telegramUsername: true,
              email: true,
            },
          },
        },
      });

      if (!log) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Audit log not found',
        });
      }

      return log;
    }),

  /**
   * Get audit log statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const [totalLogs, logsByAction, recentActivity] = await Promise.all([
      prisma.userAuditLog.count(),
      prisma.userAuditLog.groupBy({
        by: ['action'],
        _count: true,
      }),
      prisma.userAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              telegramUsername: true,
            },
          },
        },
      }),
    ]);

    const actionCounts = logsByAction.reduce((acc: any, item) => {
      acc[item.action] = item._count;
      return acc;
    }, {});

    return {
      totalLogs,
      actionCounts,
      recentActivity,
    };
  }),
});
