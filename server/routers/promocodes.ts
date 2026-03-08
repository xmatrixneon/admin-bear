import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Promocode input schemas
 */
const promocodeCreateSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  count: z.number().int().min(1).max(50).default(1),
  maxUses: z.number().int().positive().default(1),
});

const promocodeUpdateSchema = z.object({
  id: z.string(),
  action: z.enum(['activate', 'deactivate']),
});

/**
 * Promocodes Router
 * Promo code generation and management
 */
export const promocodesRouter = router({
  /**
   * List all promocodes with usage history counts
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const promocodes = await prisma.promocode.findMany({
      include: {
        _count: {
          select: { history: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return promocodes;
  }),

  /**
   * Generate multiple promocodes
   */
  generate: protectedProcedure
    .input(promocodeCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      const promocodes = [];

      for (let i = 0; i < input.count; i++) {
        const code = `PROMO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const promocode = await prisma.promocode.create({
          data: {
            code,
            amount: input.amount,
            maxUses: input.maxUses,
            usedCount: 0,
            isActive: true,
          },
        });
        promocodes.push(promocode);
      }

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id, // Use adminId as userId for system operations
          adminId: admin.id,
          action: 'CREATE_PROMOCODE',
          changes: {
            count: input.count,
            amount: input.amount,
            maxUses: input.maxUses,
            codes: promocodes.map((p) => p.code),
          },
        },
      });

      return promocodes;
    }),

  /**
   * Activate or deactivate a promocode
   */
  update: protectedProcedure
    .input(promocodeUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if promocode exists
      const existing = await prisma.promocode.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Promocode not found',
        });
      }

      const updateData: any = {
        isActive: input.action === 'activate',
      };

      const promocode = await prisma.promocode.update({
        where: { id: input.id },
        data: updateData,
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id, // Use adminId as userId for system operations
          adminId: admin.id,
          action: 'UPDATE_PROMOCODE',
          changes: {
            action: input.action,
            previous: { isActive: existing.isActive },
            new: { isActive: promocode.isActive },
          },
        },
      });

      return promocode;
    }),

  /**
   * Delete a promocode
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if promocode exists
      const existing = await prisma.promocode.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Promocode not found',
        });
      }

      // Check if promocode has been used
      if (existing.usedCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete promocode that has been used ${existing.usedCount} times`,
        });
      }

      await prisma.promocode.delete({
        where: { id: input.id },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id, // Use adminId as userId for system operations
          adminId: admin.id,
          action: 'DELETE_PROMOCODE',
          changes: { id: input.id, code: existing.code },
        },
      });

      return { success: true };
    }),
});
