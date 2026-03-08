import { verifyAdminToken, verifyAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * tRPC Context
 * Provides database client and authentication state to all procedures
 */
export type Context = {
  prisma: typeof prisma;
  admin?: {
    id: string;
    name?: string | null;
    telegramId?: string | null;
    isAdmin: boolean;
  };
};

/**
 * Create async iterable context for Next.js
 * Used by tRPC with Next.js adapter
 */
export async function createContext(): Promise<Context> {
  return {
    prisma,
  };
}
