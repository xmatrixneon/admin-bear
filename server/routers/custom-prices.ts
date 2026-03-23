import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@/app/generated/prisma/client';
import { router, protectedProcedure } from '../trpc';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const customPriceCreateSchema = z.object({
  userId:     z.string().min(1, 'User ID is required'),
  serviceId:  z.string().min(1, 'Service ID is required'),
  discount:   z.number().positive('Discount must be positive'),
  type:       z.enum(['FLAT', 'PERCENT']),
});

const customPriceUpdateSchema = z.object({
  id:       z.string().cuid(),
  discount: z.number().positive('Discount must be positive').optional(),
  type:     z.enum(['FLAT', 'PERCENT']).optional(),
});

const customPriceDeleteSchema = z.object({
  id: z.string().cuid(),
});

const bulkDiscountCreateSchema = z.object({
  userId:    z.string().min(1, 'User ID is required'),
  discount:  z.number().positive('Discount must be positive'),
  type:      z.enum(['FLAT', 'PERCENT']),
  country:   z.string().optional(), // Optional: filter by country
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const customPricesRouter = router({

  /**
   * List all custom prices with user and service details
   */
  list: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      serviceId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const where: Prisma.CustomPriceWhereInput = {};

      if (input?.userId) {
        where.userId = input.userId;
      }

      if (input?.serviceId) {
        where.serviceId = input.serviceId;
      }

      return prisma.customPrice.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              telegramUsername: true,
              telegramId: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              code: true,
              basePrice: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });
    }),

  /**
   * Get a single custom price by ID
   */
  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const customPrice = await prisma.customPrice.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              telegramUsername: true,
              telegramId: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              code: true,
              basePrice: true,
            },
          },
        },
      });

      if (!customPrice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Custom price not found' });
      }

      return customPrice;
    }),

  /**
   * Create a new custom price discount
   */
  create: protectedProcedure
    .input(customPriceCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Get max discount from settings
      const settings = await prisma.settings.findUnique({ where: { id: '1' } });
      const maxDiscountPercent = settings?.maxDiscountPercent ?? 20;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Verify service exists
      const service = await prisma.service.findUnique({
        where: { id: input.serviceId },
      });

      if (!service) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service not found' });
      }

      // Check if custom price already exists for this user+service combo
      const existing = await prisma.customPrice.findUnique({
        where: {
          userId_serviceId: {
            userId: input.userId,
            serviceId: input.serviceId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Custom price already exists for this user and service',
        });
      }

      // Validate discount against settings
      if (input.type === 'PERCENT') {
        if (input.discount > maxDiscountPercent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Discount cannot exceed ${maxDiscountPercent}%`,
          });
        }
      } else {
        // FLAT: Validate discount doesn't exceed base price
        const discount = new Prisma.Decimal(input.discount);
        const basePrice = service.basePrice;

        if (discount.greaterThan(basePrice)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Flat discount (₹${input.discount}) cannot exceed base price (₹${basePrice})`,
          });
        }
      }

      const customPrice = await prisma.customPrice.create({
        data: {
          userId: input.userId,
          serviceId: input.serviceId,
          discount: new Prisma.Decimal(input.discount),
          type: input.type,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              telegramUsername: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              code: true,
              basePrice: true,
            },
          },
        },
      });

      // Audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'CREATE_CUSTOM_PRICE',
          changes: {
            userId: input.userId,
            serviceId: input.serviceId,
            discount: input.discount,
            type: input.type,
          },
        },
      });

      return customPrice;
    }),

  /**
   * Update an existing custom price
   */
  update: protectedProcedure
    .input(customPriceUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Get max discount from settings
      const settings = await prisma.settings.findUnique({ where: { id: '1' } });
      const maxDiscountPercent = settings?.maxDiscountPercent ?? 20;

      const existing = await prisma.customPrice.findUnique({
        where: { id: input.id },
        include: {
          service: true,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Custom price not found' });
      }

      // Prepare update data
      const updateData: Prisma.CustomPriceUpdateInput = {};

      // Determine the final type after update (existing or new)
      const finalType = input.type ?? existing.type;

      if (input.discount !== undefined) {
        // Validate against max discount for PERCENT type
        if (finalType === 'PERCENT') {
          if (input.discount > maxDiscountPercent) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Discount cannot exceed ${maxDiscountPercent}%`,
            });
          }
        } else if (finalType === 'FLAT') {
          // Validate for FLAT type
          const discount = new Prisma.Decimal(input.discount);
          if (discount.greaterThan(existing.service.basePrice)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Flat discount (₹${input.discount}) cannot exceed base price (₹${existing.service.basePrice})`,
            });
          }
        }
        updateData.discount = new Prisma.Decimal(input.discount);
      }

      // Additional validation: if changing type to FLAT, validate existing discount
      if (input.type === 'FLAT' && input.discount === undefined) {
        if (existing.discount.greaterThan(existing.service.basePrice)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot change to FLAT - existing discount (₹${existing.discount}) exceeds base price (₹${existing.service.basePrice})`,
          });
        }
      }

      // If changing to PERCENT, validate existing discount against max
      if (input.type === 'PERCENT' && input.discount === undefined) {
        if (existing.discount.toNumber() > maxDiscountPercent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot change to PERCENT - existing discount (${existing.discount}%) exceeds maximum (${maxDiscountPercent}%)`,
          });
        }
      }

      if (input.type !== undefined) {
        updateData.type = input.type;
      }

      const updated = await prisma.customPrice.update({
        where: { id: input.id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              telegramUsername: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              code: true,
              basePrice: true,
            },
          },
        },
      });

      // Audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'UPDATE_CUSTOM_PRICE',
          changes: {
            id: input.id,
            previous: {
              discount: existing.discount.toNumber(),
              type: existing.type,
            },
            new: {
              discount: updated.discount.toNumber(),
              type: updated.type,
            },
          },
        },
      });

      return updated;
    }),

  /**
   * Delete a custom price
   */
  delete: protectedProcedure
    .input(customPriceDeleteSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      const existing = await prisma.customPrice.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              firstName: true,
              telegramUsername: true,
            },
          },
          service: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Custom price not found' });
      }

      await prisma.customPrice.delete({
        where: { id: input.id },
      });

      // Audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'DELETE_CUSTOM_PRICE',
          changes: {
            id: input.id,
            user: existing.user.telegramUsername || existing.user.firstName,
            service: existing.service.name,
            discount: existing.discount.toNumber(),
            type: existing.type,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Create discount for all services (bulk)
   * Uses the new global default discount method on User table
   */
  createBulk: protectedProcedure
    .input(bulkDiscountCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Get max discount from settings
      const settings = await prisma.settings.findUnique({ where: { id: '1' } });
      const maxDiscountPercent = settings?.maxDiscountPercent ?? 20;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, telegramUsername: true, defaultDiscount: true, defaultDiscountType: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Country filter is not supported with global discounts - use service-specific CustomPrice instead
      if (input.country) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Country-specific bulk discounts are not supported. Use the new global discount method instead, or create individual CustomPrice entries.',
        });
      }

      // Validate discount against settings
      if (input.type === 'PERCENT') {
        if (input.discount > maxDiscountPercent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Discount cannot exceed ${maxDiscountPercent}%`,
          });
        }
      } else if (input.type === 'FLAT') {
        // For FLAT discounts, validate against the lowest service base price
        const lowestPrice = await prisma.service.findFirst({
          where: { isActive: true },
          orderBy: { basePrice: 'asc' },
          select: { basePrice: true },
        });

        if (lowestPrice) {
          const discount = new Prisma.Decimal(input.discount);
          if (discount.greaterThan(lowestPrice.basePrice)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Flat discount ₹${input.discount} exceeds lowest service base price (₹${lowestPrice.basePrice}). Some services will get free numbers.`,
            });
          }
        }
      }

      // Get current discount values for audit
      const previousDiscount = user.defaultDiscount?.toString();
      const previousType = user.defaultDiscountType;

      // Update user with global default discount
      const updated = await prisma.user.update({
        where: { id: input.userId },
        data: {
          defaultDiscount: input.discount,
          defaultDiscountType: input.type,
        },
      });

      // Count and delete old CustomPrice entries for this user (they're now redundant)
      const deletedCustomPrices = await prisma.customPrice.deleteMany({
        where: { userId: input.userId },
      });

      // Get total active services count for response
      const totalServices = await prisma.service.count({
        where: { isActive: true },
      });

      // Audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'SET_DEFAULT_DISCOUNT',
          changes: {
            userId: input.userId,
            discount: input.discount,
            type: input.type,
            previousDiscount,
            previousType,
            oldCustomPricesRemoved: deletedCustomPrices.count,
          },
        },
      });

      return {
        success: true,
        method: 'global',
        discount: input.discount,
        type: input.type,
        oldCustomPricesRemoved: deletedCustomPrices.count,
        totalServices,
      };
    }),

  /**
   * Get users search results for dropdown
   */
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      return prisma.user.findMany({
        where: {
          OR: [
            { telegramId: { contains: input.query, mode: 'insensitive' } },
            { telegramUsername: { contains: input.query, mode: 'insensitive' } },
            { firstName: { contains: input.query, mode: 'insensitive' } },
            { lastName: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          telegramUsername: true,
          telegramId: true,
        },
        take: 20,
      });
    }),

  /**
   * Get services list for dropdown
   */
  listServices: protectedProcedure
    .input(z.object({
      country: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const where: Prisma.ServiceWhereInput = {
        isActive: true,
      };

      if (input?.country) {
        where.server = {
          countryCode: input.country,
          isActive: true,
        };
      }

      return prisma.service.findMany({
        where,
        include: {
          server: {
            select: {
              id: true,
              name: true,
              countryCode: true,
            },
          },
        },
        orderBy: [{ server: { countryCode: 'asc' } }, { name: 'asc' }],
      });
    }),

  /**
   * Get users with global default discounts
   */
  listUsersWithDiscounts: protectedProcedure
    .query(async ({ ctx }) => {
      const { prisma } = ctx;

      return prisma.user.findMany({
        where: {
          defaultDiscount: { not: null },
          deletedAt: null,
        },
        select: {
          id: true,
          telegramUsername: true,
          firstName: true,
          lastName: true,
          defaultDiscount: true,
          defaultDiscountType: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }),

  /**
   * Update global default discount for a user
   */
  updateGlobalDiscount: protectedProcedure
    .input(z.object({
      userId: z.string().min(1, 'User ID is required'),
      discount: z.number().positive('Discount must be positive'),
      type: z.enum(['FLAT', 'PERCENT']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Get max discount from settings
      const settings = await prisma.settings.findUnique({ where: { id: '1' } });
      const maxDiscountPercent = settings?.maxDiscountPercent ?? 20;

      // Validate discount against settings
      if (input.type === 'PERCENT') {
        if (input.discount > maxDiscountPercent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Discount cannot exceed ${maxDiscountPercent}%`,
          });
        }
      }

      // Get user for audit
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, telegramUsername: true, defaultDiscount: true, defaultDiscountType: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const previousDiscount = user.defaultDiscount?.toString();
      const previousType = user.defaultDiscountType;

      // Update user's global default discount
      const updated = await prisma.user.update({
        where: { id: input.userId },
        data: {
          defaultDiscount: input.discount,
          defaultDiscountType: input.type,
        },
      });

      // Audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'UPDATE_GLOBAL_DISCOUNT',
          changes: {
            userId: input.userId,
            discount: input.discount,
            type: input.type,
            previousDiscount,
            previousType,
          },
        },
      });

      return {
        success: true,
        discount: input.discount,
        type: input.type,
      };
    }),

  /**
   * Delete global default discount for a user
   */
  deleteGlobalDiscount: protectedProcedure
    .input(z.object({
      userId: z.string().min(1, 'User ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Get user for audit
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, telegramUsername: true, defaultDiscount: true, defaultDiscountType: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const previousDiscount = user.defaultDiscount?.toString();
      const previousType = user.defaultDiscountType;

      // Remove global default discount
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          defaultDiscount: null,
          defaultDiscountType: null,
        },
      });

      // Audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'DELETE_GLOBAL_DISCOUNT',
          changes: {
            userId: input.userId,
            previousDiscount,
            previousType,
          },
        },
      });

      return { success: true };
    }),
});
