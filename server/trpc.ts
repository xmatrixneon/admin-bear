import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';
import { verifyAdminToken } from '@/lib/auth';

/**
 * Initialize tRPC server with context type
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

/**
 * Public procedure - no authentication required
 * Note: For this admin panel, most procedures should use protectedProcedure
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires admin authentication
 * Validates Bearer token from Authorization header
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  // Note: Authentication is handled in the API route handler
  // The admin info is added to the context in app/api/trpc/[trpc]/route.ts
  if (!ctx.admin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid admin token.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin,
    },
  });
});

/**
 * Create tRPC router
 */
export const router = t.router;

/**
 * Export tRPC instance for creating routers
 */
export const middleware = t.middleware;

/**
 * Create tRPC caller (for internal calls)
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Helper to verify admin token and return admin data
 */
export async function getAdminFromToken(token?: string) {
  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No token provided',
    });
  }

  // Verify the token
  const isValid = verifyAdminToken(token);
  if (!isValid) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  // Decode token to get admin info
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

    // Verify token hasn't expired
    if (decoded.exp < Date.now()) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Token has expired',
      });
    }

    return {
      id: decoded.id,
      name: decoded.name,
      telegramId: decoded.telegramId,
      isAdmin: decoded.isAdmin ?? true,
    };
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid token format',
    });
  }
}
