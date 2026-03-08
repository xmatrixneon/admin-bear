import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { verifyAdmin } from '@/lib/auth';

/**
 * Login input schema
 */
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Login Router
 * Handles admin authentication for the admin panel
 */
export const loginRouter = router({
  /**
   * Login with username and password
   * Returns a token for authenticated requests
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const result = await verifyAdmin(input);

      if (!result.success) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: result.error || 'Invalid credentials',
        });
      }

      return result.data;
    }),
});
