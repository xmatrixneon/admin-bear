import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { adminRouter, getAdminFromToken } from '@/server/routers/_app';
import { createContext } from '@/server/context';

/**
 * tRPC API Route Handler for Next.js
 * Handles all tRPC requests via /api/trpc/[trpc] endpoint
 */
const handler = async (req: Request) => {
  // Extract authorization header
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  // Verify admin token and add to context
  let admin;
  if (token) {
    try {
      admin = await getAdminFromToken(token);
    } catch (error) {
      // Token invalid - will be handled by individual procedures
    }
  }

  // Create context with admin info
  const context = await createContext();
  const enhancedContext = {
    ...context,
    admin,
  };

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: adminRouter,
    createContext: () => enhancedContext,
    onError: ({ error }) => {
      // Log errors for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('tRPC Error:', error);
      }
    },
  });
};

export { handler as GET, handler as POST };
