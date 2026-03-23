import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@app/generated/prisma/client';
import { router, protectedProcedure } from '../trpc';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const customPriceCreateSchema = z.object({
  userId:     z.string().cuid('Invalid user ID'),
  serviceId:  z.string().min(1, 'Service ID is required'),
  discount:   z.number().positive('Discount must be positive').max(100, 'Discount cannot exceed 100'),
  type:       z.enum(['FLAT', 'PERCENT']),
});

const customPriceUpdateSchema = z.object({
  id:       z.string().cuid(),
  discount: z.number().positive('Discount must be positive').max(100, 'Discount cannot exceed 100').optional(),
  type:     z.enum(['FLAT', 'PERCENT']).optional(),
});

const customPriceDeleteSchema = z.object({
  id: z.string().cuid(),
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
        orderBy: { createdAt: 'desc' },
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

      // Validate discount doesn't exceed base price for FLAT type
      if (input.type === 'FLAT') {
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

      if (input.discount !== undefined) {
        // Validate for FLAT type
        if (input.type === 'FLAT' || (input.type === undefined && existing.type === 'FLAT')) {
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
        take: 100,
      });
    }),
});
