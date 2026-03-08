import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Server input schema
 */
const serverInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  countryIso: z.string().default('IN'),
  countryName: z.string().default('India'),
  flagUrl: z.string().url().optional().or(z.literal('')),
  apiId: z.string().min(1, 'API ID is required'),
  isActive: z.boolean().default(true),
});

/**
 * Servers Router
 * Full CRUD operations for OTP server management
 */
export const serversRouter = router({
  /**
   * List all servers with API credentials and service counts
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const servers = await prisma.otpServer.findMany({
      include: {
        api: true,
        _count: {
          select: { services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return servers;
  }),

  /**
   * Get a single server by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const server = await prisma.otpServer.findUnique({
        where: { id: input.id },
        include: {
          api: true,
          services: {
            include: {
              server: {
                include: {
                  api: true,
                },
              },
            },
          },
        },
      });

      if (!server) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Server not found',
        });
      }

      return server;
    }),

  /**
   * Create a new server
   */
  create: protectedProcedure
    .input(serverInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if API credential exists
      const apiCredential = await prisma.apiCredential.findUnique({
        where: { id: input.apiId },
      });

      if (!apiCredential) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API credential not found',
        });
      }

      const server = await prisma.otpServer.create({
        data: {
          name: input.name,
          countryCode: input.countryCode,
          countryIso: input.countryIso,
          countryName: input.countryName,
          flagUrl: input.flagUrl || null,
          apiId: input.apiId,
          isActive: input.isActive,
        },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id, // Use adminId as userId for system operations
          adminId: admin.id,
          action: 'CREATE_SERVER',
          changes: server,
        },
      });

      return server;
    }),

  /**
   * Update an existing server
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: serverInputSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if server exists
      const existing = await prisma.otpServer.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Server not found',
        });
      }

      // If updating API ID, verify it exists
      if (input.data.apiId) {
        const apiCredential = await prisma.apiCredential.findUnique({
          where: { id: input.data.apiId },
        });

        if (!apiCredential) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'API credential not found',
          });
        }
      }

      const server = await prisma.otpServer.update({
        where: { id: input.id },
        data: input.data,
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id, // Use adminId as userId for system operations
          adminId: admin.id,
          action: 'UPDATE_SERVER',
          changes: {
            previous: existing,
            new: server,
          },
        },
      });

      return server;
    }),

  /**
   * Delete a server
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Check if server exists
      const existing = await prisma.otpServer.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Server not found',
        });
      }

      // Check for associated services
      const serviceCount = await prisma.service.count({
        where: { serverId: input.id },
      });

      if (serviceCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete server with ${serviceCount} associated services. Please delete or reassign the services first.`,
        });
      }

      await prisma.otpServer.delete({
        where: { id: input.id },
      });

      // Create audit log
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id, // Use adminId as userId for system operations
          adminId: admin.id,
          action: 'DELETE_SERVER',
          changes: { id: input.id, name: existing.name },
        },
      });

      return { success: true };
    }),
});
