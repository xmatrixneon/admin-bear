import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// FIX: cache BOTH pool and prisma globally.
// Previously only prisma was cached — on every Next.js hot reload in dev,
// createPrismaClient() was called again, creating a new Pool each time
// even though the prisma instance was reused. Each Pool holds its own
// pg connections → connection leak over time.
const g = globalThis as unknown as {
  pool: Pool | undefined;
  prisma: PrismaClient | undefined;
};

function getPool(): Pool {
  if (!g.pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("[db] DATABASE_URL is not set");
    }
    // Pool configuration for PGBouncer transaction pooling:
    // - max: 5 per process (admin panel is less trafficked than main app)
    // - PGBouncer handles actual connection pooling to PostgreSQL (max 40)
    // - connectionTimeoutMillis: 30s for busy periods
    // - idleTimeoutMillis: 30s to reduce connection churn and improve stability
    g.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 30_000,
    });
    g.pool.on("error", (err) => {
      console.error("[db] Unexpected pg pool error:", err);
    });
  }
  return g.pool;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(getPool());
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = g.prisma ?? createPrismaClient();

// Cache prisma globally to prevent multiple instances in production
// Each PM2 worker has its own globalThis context, but we still want
// to reuse the same instance within each process
if (process.env.NODE_ENV === "production") {
  g.prisma = prisma;
}

/**
 * Transaction helper with proper timeout configuration and retry logic for deadlocks.
 *
 * Best practices from Prisma docs:
 * - timeout: 30s (default 5s is too short for complex operations)
 * - maxWait: 20s (default 2s, increased to handle pool exhaustion during high load)
 * - isolationLevel: ReadCommitted (PostgreSQL default, good for concurrency)
 *
 * Retries P2034 errors (write conflicts/deadlocks) up to 3 times.
 *
 * @example
 * ```ts
 * await withTransaction(async (tx) => {
 *   await tx.user.create({ data: { name: 'John' } });
 *   await tx.post.create({ data: { title: 'Hello' } });
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options?: {
    maxRetries?: number;
    timeout?: number;
    maxWait?: number;
  }
): Promise<T> {
  const MAX_RETRIES = options?.maxRetries ?? 3;
  const timeout = options?.timeout ?? 30000; // 30s default
  const maxWait = options?.maxWait ?? 20000; // 20s default (increased from 10s)
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      return await prisma.$transaction(
        callback,
        {
          maxWait,
          timeout,
        }
      );
    } catch (error: any) {
      // P2034: Transaction failed due to a write conflict or a deadlock
      if (error.code === 'P2034') {
        retries++;
        console.warn(`[transaction] Deadlock detected, retrying (${retries}/${MAX_RETRIES})...`);
        // Exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retries - 1), 5000)));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`[transaction] Max retries (${MAX_RETRIES}) exceeded for deadlock/write conflict`);
}

export default prisma;
