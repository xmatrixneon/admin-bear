import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { router, protectedProcedure } from '../trpc';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const promocodeCreateSchema = z.object({
  amount:     z.number().positive('Amount must be positive'),
  count:      z.number().int().min(1).max(50).default(1),
  maxUses:    z.number().int().positive().default(1),
  // Optional: provide a specific code instead of auto-generating
  customCode: z
    .string()
    .min(3)
    .max(32)
    .toUpperCase()
    .optional(),
});

const promocodeUpdateSchema = z.object({
  id:     z.string(),
  action: z.enum(['activate', 'deactivate']),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a 12-character random promo code.
 * Example: A3BX9ZK2MN7Q
 * No ambiguous chars (0/O, I/1) for readability.
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const promocodesRouter = router({

  /**
   * List all promocodes with usage history counts
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    return prisma.promocode.findMany({
      include: {
        _count: { select: { history: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  /**
   * Generate one or more promocodes.
   * If customCode is provided and count=1, uses that exact code.
   */
  generate: protectedProcedure
    .input(promocodeCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Custom code only allowed when generating a single code
      if (input.customCode && input.count > 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Custom code can only be used when count is 1',
        });
      }

      // Check custom code isn't already taken
      if (input.customCode) {
        const existing = await prisma.promocode.findUnique({
          where: { code: input.customCode },
        });
        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Code "${input.customCode}" already exists`,
          });
        }
      }

      const promocodes = [];

      for (let i = 0; i < input.count; i++) {
        const code = input.customCode ?? generateCode();

        const promocode = await prisma.promocode.create({
          data: {
            code,
            amount:    input.amount,
            maxUses:   input.maxUses,
            usedCount: 0,
            isActive:  true,
          },
        });
        promocodes.push(promocode);
      }

      await prisma.userAuditLog.create({
        data: {
          userId:  admin.id,
          adminId: admin.id,
          action:  'CREATE_PROMOCODE',
          changes: {
            count:   input.count,
            amount:  input.amount,
            maxUses: input.maxUses,
            codes:   promocodes.map((p) => p.code),
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

      const existing = await prisma.promocode.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Promocode not found' });
      }

      const promocode = await prisma.promocode.update({
        where: { id: input.id },
        data:  { isActive: input.action === 'activate' },
      });

      await prisma.userAuditLog.create({
        data: {
          userId:  admin.id,
          adminId: admin.id,
          action:  'UPDATE_PROMOCODE',
          changes: {
            action:   input.action,
            previous: { isActive: existing.isActive },
            new:      { isActive: promocode.isActive },
          },
        },
      });

      return promocode;
    }),

  /**
   * Delete a promocode (only if never used)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      const existing = await prisma.promocode.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Promocode not found' });
      }

      if (existing.usedCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete a code that has been used ${existing.usedCount} time(s)`,
        });
      }

      await prisma.promocode.delete({ where: { id: input.id } });

      await prisma.userAuditLog.create({
        data: {
          userId:  admin.id,
          adminId: admin.id,
          action:  'DELETE_PROMOCODE',
          changes: { id: input.id, code: existing.code },
        },
      });

      return { success: true };
    }),
});
