import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Input schemas for users router
 */
const userFilterSchema = z.enum(['all', 'admin', 'regular', 'deleted']);
const sortBySchema = z.enum(['createdAt', 'telegramId', 'balance', 'totalOtp', 'name']);
const sortOrderSchema = z.enum(['asc', 'desc']);
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Users Router
 * User management with list, update, delete, balance adjustment, and status changes
 */
export const usersRouter = router({
  /**
   * List users with filtering, sorting, and pagination
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          filter: userFilterSchema.default('all'),
          sortBy: sortBySchema.default('createdAt'),
          sortOrder: sortOrderSchema.default('desc'),
        })
        .merge(paginationSchema)
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const where: any = {};

      // Handle filter
      if (input.filter === 'deleted') {
        where.deletedAt = { not: null };
      } else {
        where.deletedAt = null;
        if (input.filter === 'admin') {
          where.isAdmin = true;
        } else if (input.filter === 'regular') {
          where.isAdmin = false;
        }
      }

      // Handle search
      if (input.search && input.search.length >= 2) {
        where.OR = [
          { email: { contains: input.search, mode: 'insensitive' } },
          { telegramId: { contains: input.search } },
          { telegramUsername: { contains: input.search, mode: 'insensitive' } },
          { firstName: { contains: input.search, mode: 'insensitive' } },
          { lastName: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      // Handle sorting
      const orderBy: any = {};
      if (input.sortBy === 'balance' || input.sortBy === 'totalOtp') {
        orderBy.wallet = {};
        orderBy.wallet[input.sortBy === 'balance' ? 'balance' : 'totalOtp'] =
          input.sortOrder === 'asc' ? 'asc' : 'desc';
      } else {
        orderBy[input.sortBy] = input.sortOrder === 'asc' ? 'asc' : 'desc';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            wallet: true,
            userData: true,
          },
          orderBy,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        },
      };
    }),

  /**
   * Update user information
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          telegramUsername: z.string().optional(),
          isPremium: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      const updated = await prisma.user.update({
        where: { id: input.id },
        data: input.data,
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: input.id,
          adminId: admin.id,
          action: 'UPDATE',
          changes: input.data,
        },
      });

      return updated;
    }),

  /**
   * Set or unset admin status on a user
   */
  setAdmin: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isAdmin: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      const user = await prisma.user.findUnique({
        where: { id: input.id },
        select: { isAdmin: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const updated = await prisma.user.update({
        where: { id: input.id },
        data: { isAdmin: input.isAdmin },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: input.id,
          adminId: admin.id,
          action: input.isAdmin ? 'SET_ADMIN' : 'REMOVE_ADMIN',
          changes: { isAdmin: { from: user.isAdmin, to: input.isAdmin } },
        },
      });

      return { success: true, user: updated };
    }),

  /**
   * Set user status (ACTIVE/BLOCKED/SUSPENDED)
   */
  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const updated = await prisma.userData.upsert({
        where: { userId: input.id },
        create: { userId: input.id, status: input.status },
        update: { status: input.status },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: input.id,
          adminId: admin.id,
          action: 'STATUS_UPDATE',
          changes: { status: input.status },
        },
      });

      return { success: true, userData: updated };
    }),

  /**
   * Adjust user balance (credit or debit)
   * Uses atomic transaction to ensure consistency
   */
  adjustBalance: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number().positive('Amount must be positive'),
        reason: z.string().min(1, 'Reason is required'),
        type: z.enum(['credit', 'debit']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Use Prisma transaction API for atomic operation
      const result = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId: input.userId },
        });

        if (!wallet) {
          // Create new wallet
          const newWallet = await tx.wallet.create({
            data: {
              userId: input.userId,
              balance: input.type === 'debit' ? 0 : input.amount,
              totalSpent: 0,
              totalOtp: 0,
              totalRecharge: 0,
            },
          });

          // Create transaction only for credit
          if (input.type === 'credit') {
            await tx.transaction.create({
              data: {
                walletId: newWallet.id,
                type: 'ADJUSTMENT',
                amount: input.amount,
                status: 'COMPLETED',
                description: input.reason,
              },
            });
          }

          return { wallet: newWallet, created: true };
        } else {
          // Update existing wallet
          const newBalance =
            input.type === 'debit'
              ? Number(wallet.balance) - input.amount
              : Number(wallet.balance) + input.amount;

          // Check for negative balance on debit
          if (input.type === 'debit' && newBalance < 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Insufficient balance',
            });
          }

          const updatedWallet = await tx.wallet.update({
            where: { userId: input.userId },
            data: { balance: newBalance },
          });

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'ADJUSTMENT',
              amount: input.type === 'debit' ? -input.amount : input.amount,
              status: 'COMPLETED',
              description: input.reason,
            },
          });

          return { wallet: updatedWallet, created: false };
        }
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: input.userId,
          adminId: admin.id,
          action: 'BALANCE_ADJUST',
          changes: {
            amount: input.amount,
            type: input.type,
            reason: input.reason,
            walletCreated: result.created,
          },
        },
      });

      return {
        success: true,
        wallet: result.wallet,
        walletCreated: result.created,
      };
    }),

  /**
   * Delete user (soft delete or permanent)
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        permanent: z.boolean().default(false),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (input.permanent) {
        await prisma.user.delete({
          where: { id: input.id },
        });
      } else {
        await prisma.user.update({
          where: { id: input.id },
          data: { deletedAt: new Date() },
        });
      }

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: input.id,
          adminId: admin.id,
          action: input.permanent ? 'DELETE' : 'SOFT_DELETE',
          reason: input.reason,
        },
      });

      return { success: true, permanent: input.permanent };
    }),

  /**
   * Set default discount for user (applies to ALL services)
   */
  setDefaultDiscount: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        discount: z.number().positive('Discount must be positive'),
        type: z.enum(['FLAT', 'PERCENT']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // For FLAT discounts, check against lowest base price to avoid issues
      if (input.type === 'FLAT') {
        const lowestPrice = await prisma.service.findFirst({
          where: { isActive: true },
          orderBy: { basePrice: 'asc' },
          select: { basePrice: true },
        });

        if (lowestPrice && input.discount > Number(lowestPrice.basePrice)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Flat discount ₹${input.discount} exceeds lowest service base price (₹${lowestPrice.basePrice}). Some services will get free numbers.`,
          });
        }
      }

      const updated = await prisma.user.update({
        where: { id: input.userId },
        data: {
          defaultDiscount: input.discount,
          defaultDiscountType: input.type,
        },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: input.userId,
          adminId: admin.id,
          action: 'SET_DEFAULT_DISCOUNT',
          changes: {
            discount: input.discount,
            type: input.type,
          },
        },
      });

      return { success: true, user: updated };
    }),

  /**
   * Remove default discount from user
   */
  removeDefaultDiscount: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { defaultDiscount: true, defaultDiscountType: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.defaultDiscount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User has no default discount to remove',
        });
      }

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          defaultDiscount: null,
          defaultDiscountType: null,
        },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: input.userId,
          adminId: admin.id,
          action: 'REMOVE_DEFAULT_DISCOUNT',
          changes: {
            previousDiscount: user.defaultDiscount,
            previousType: user.defaultDiscountType,
          },
        },
      });

      return { success: true };
    }),
});
