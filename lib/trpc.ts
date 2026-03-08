'use client';

import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import superjson from 'superjson';
import type { AdminRouter } from '@/server/routers';

/**
 * Create tRPC React Query client for the admin panel
 * This provides type-safe API calls with automatic caching and loading states
 */
export const trpc = createTRPCReact<AdminRouter>();
