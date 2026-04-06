import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Service input schema
 */
const serviceInputSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  serverId: z.string().min(1, 'Server ID is required'),
  basePrice: z.number().positive('Price must be positive'),
  iconUrl: z.string().max(500, 'Icon URL too long').optional().default(''),
  isActive: z.boolean().default(true),
});

/**
 * Type for grouped service list response
 */
type GroupedService = {
  code: string;
  name: string;
  iconUrl: string | null;
  servers: Array<{
    id: string;
    name: string;
    countryCode: string;
    countryIso: string;
    serviceId: string;
    servicePrice: number;
    serviceIsActive: boolean;
  }>;
  prices: number[];
  totalPurchases: number;
  anyInactive: boolean;
  minPrice: number;
  maxPrice: number;
  priceRange: string;
  isAllSamePrice: boolean;
};

/**
 * Services Router
 * Full CRUD operations for service management
 */
export const servicesRouter = router({
  /**
   * List all services grouped by code with server details
   * Each service code appears once, showing all servers it's available on
   */
  list: protectedProcedure.query(async ({ ctx }): Promise<GroupedService[]> => {
    const { prisma } = ctx;

    const services = await prisma.service.findMany({
      include: {
        server: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            countryIso: true,
          },
        },
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Group services by code
    const groupedServices = new Map<string, {
      code: string;
      name: string;
      iconUrl: string | null;
      servers: Array<{
        id: string;
        name: string;
        countryCode: string;
        countryIso: string;
        serviceId: string;
        servicePrice: number;
        serviceIsActive: boolean;
      }>;
      prices: number[];
      totalPurchases: number;
      anyInactive: boolean;
    }>();

    for (const service of services) {
      const existing = groupedServices.get(service.code);
      if (existing) {
        existing.servers.push({
          id: service.server.id,
          name: service.server.name,
          countryCode: service.server.countryCode,
          countryIso: service.server.countryIso,
          // Include the service ID for editing individual services
          serviceId: service.id,
          servicePrice: Number(service.basePrice),
          serviceIsActive: service.isActive,
        });
        existing.prices.push(Number(service.basePrice));
        existing.totalPurchases += service._count.purchases;
      } else {
        groupedServices.set(service.code, {
          code: service.code,
          name: service.name,
          iconUrl: service.iconUrl,
          servers: [{
            id: service.server.id,
            name: service.server.name,
            countryCode: service.server.countryCode,
            countryIso: service.server.countryIso,
            // Include the service ID for editing individual services
            serviceId: service.id,
            servicePrice: Number(service.basePrice),
            serviceIsActive: service.isActive,
          }],
          prices: [Number(service.basePrice)],
          totalPurchases: service._count.purchases,
          anyInactive: !service.isActive,
        });
      }
    }

    // Convert to array and add computed fields
    return Array.from(groupedServices.values()).map(service => ({
      ...service,
      minPrice: Math.min(...service.prices),
      maxPrice: Math.max(...service.prices),
      priceRange: service.prices.length > 1
        ? `${service.prices[0].toFixed(2)} - ${service.prices[service.prices.length - 1].toFixed(2)}`
        : service.prices[0].toFixed(2),
      isAllSamePrice: service.prices.length === 1 || new Set(service.prices).size === 1,
    }));
  }),

  /**
   * Get a single service by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const service = await prisma.service.findUnique({
        where: { id: input.id },
        include: {
          server: {
            include: {
              api: true,
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      return service;
    }),

  /**
   * Create a new service
   */
  create: protectedProcedure
    .input(serviceInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if server exists
      const server = await prisma.otpServer.findUnique({
        where: { id: input.serverId },
      });

      if (!server) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Server not found',
        });
      }

      // Generate code if not provided
      const code = input.code || input.name.substring(0, 10).toLowerCase().replace(/\s+/g, '-');

      // Check for duplicate code on this server
      const existing = await prisma.service.findUnique({
        where: {
          code_serverId: {
            code,
            serverId: input.serverId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A service with this code already exists on this server',
        });
      }

      const service = await prisma.service.create({
        data: {
          code,
          name: input.name,
          serverId: input.serverId,
          basePrice: input.basePrice,
          iconUrl: input.iconUrl ?? '',
          isActive: input.isActive,
        },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'CREATE_SERVICE',
          changes: service,
        },
      });

      return service;
    }),

  /**
   * Update an existing service
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: serviceInputSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if service exists
      const existing = await prisma.service.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      // If updating server, verify it exists
      if (input.data.serverId) {
        const server = await prisma.otpServer.findUnique({
          where: { id: input.data.serverId },
        });

        if (!server) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Server not found',
          });
        }
      }

      const service = await prisma.service.update({
        where: { id: input.id },
        data: {
          ...input.data,
          iconUrl: input.data.iconUrl ?? '',
        },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'UPDATE_SERVICE',
          changes: {
            previous: existing,
            new: service,
          },
        },
      });

      return service;
    }),

  /**
   * Delete a service
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if service exists
      const existing = await prisma.service.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      await prisma.service.delete({
        where: { id: input.id },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'DELETE_SERVICE',
          changes: { id: input.id, name: existing.name, code: existing.code },
        },
      });

      return { success: true };
    }),
});
